const express = require('express');
const path = require('path');
const fs = require('fs');
const PDF = require('../models/PDF');
const User = require('../models/User');
const { protect, checkResourceOwnership, userRateLimit, logActivity } = require('../middleware/auth');
const { validate, pdfSchemas, idSchema, uuidSchema } = require('../middleware/validation');
const { uploadPDF, handleUploadError, calculateChecksum, deleteFile, getUploadPath } = require('../utils/upload');
const pdfProcessor = require('../utils/pdfProcessor');
const { logUserActivity, logError, logFileOperation } = require('../utils/logger');

const router = express.Router();
router.use(userRateLimit(50, 15 * 60 * 1000));

router.post('/upload',
  protect,
  uploadPDF,
  handleUploadError,
  logActivity('PDF upload'),
  async (req, res, next) => {
    let uploadedFilePath = null;
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { originalname, filename, path: filePath, size, mimetype } = req.file;
      uploadedFilePath = filePath;
      const validation = await pdfProcessor.validatePDF(filePath);
      if (!validation.valid) {
        await deleteFile(filePath);
        return res.status(400).json({
          success: false,
          message: 'Invalid PDF file',
          error: validation.error
        });
      }

      const isProtected = await pdfProcessor.isPasswordProtected(filePath);
      if (isProtected) {
        await deleteFile(filePath);
        return res.status(400).json({
          success: false,
          message: 'Password-protected PDFs are not supported'
        });
      }

      const checksum = await calculateChecksum(filePath);

      const existingPDF = await PDF.findOne({
        userId: req.user._id,
        checksum
      });

      if (existingPDF) {
        await deleteFile(filePath);
        return res.status(400).json({
          success: false,
          message: 'File already exists in your library',
          data: {
            existingPDF: existingPDF.getFullInfo()
          }
        });
      }
      const pdf = new PDF({
        originalName: originalname,
        displayName: originalname.replace(/\.[^/.]+$/, ''), 
        fileName: filename,
        filePath,
        fileSize: size,
        mimeType: mimetype,
        userId: req.user._id,
        checksum,
        processingStatus: 'pending'
      });

      await pdf.save();
      setImmediate(async () => {
        try {
          pdf.processingStatus = 'processing';
          await pdf.save();

          const processingResult = await pdfProcessor.processPDF(filePath);
          Object.assign(pdf, processingResult);
          await pdf.save();

          logFileOperation('processed', filename, {
            pdfId: pdf._id,
            pageCount: processingResult.metadata.pageCount,
            userId: req.user._id
          });

        } catch (error) {
          logError(error, {
            operation: 'Background PDF processing',
            pdfId: pdf._id,
            userId: req.user._id
          });

          // Persist the failure status without re-saving the (possibly invalid)
          // processing result that caused the error. A targeted update avoids
          // re-triggering the same validation error and crashing the process.
          try {
            await PDF.updateOne(
              { _id: pdf._id },
              { processingStatus: 'failed', processingError: error.message }
            );
          } catch (saveError) {
            logError(saveError, {
              operation: 'Background PDF processing - status update',
              pdfId: pdf._id
            });
          }
        }
      });
      logUserActivity(req.user._id, 'PDF uploaded', {
        pdfId: pdf._id,
        originalName: originalname,
        fileSize: size,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'PDF uploaded successfully',
        data: {
          pdf: pdf.getFullInfo()
        }
      });

    } catch (error) {
      if (uploadedFilePath) {
        await deleteFile(uploadedFilePath).catch(() => {});
      }

      logError(error, {
        operation: 'PDF upload',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);


router.get('/',
  protect,
  validate(pdfSchemas.pdfQuery, 'query'),
  async (req, res, next) => {
    try {
      const {
        page,
        limit,
        search,
        category,
        tags,
        isArchived,
        isFavorite,
        sortBy,
        sortOrder
      } = req.query;
      const filters = {};
      if (search) filters.search = search;
      if (category) filters.category = category;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
      if (isArchived !== undefined) filters.isArchived = isArchived;
      if (isFavorite !== undefined) filters.isFavorite = isFavorite;

      const query = PDF.findByUserWithFilters(req.user._id, filters);
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      query.sort(sortOptions);
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);
      query.populate({
        path: 'highlights',
        select: '_id',
        match: { isDeleted: { $ne: true } }
      });

      const pdfs = await query.exec();
      const totalQuery = PDF.findByUserWithFilters(req.user._id, filters);
      const total = await totalQuery.countDocuments();
      const formattedPDFs = pdfs.map(pdf => ({
        ...pdf.getFullInfo(),
        highlightCount: pdf.highlights ? pdf.highlights.length : 0
      }));

      res.status(200).json({
        success: true,
        data: {
          pdfs: formattedPDFs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get user PDFs',
        userId: req.user._id,
        query: req.query
      });
      next(error);
    }
  }
);

// MOVED UP: Stats route BEFORE /:uuid
router.get('/stats',
  protect,
  async (req, res, next) => {
    try {
      const userId = req.user._id;
      const [
        totalPDFs,
        archivedPDFs,
        favoritePDFs,
        publicPDFs,
        totalSize,
        recentPDFs,
        popularCategories,
        popularTags
      ] = await Promise.all([
        PDF.countDocuments({ userId }),
        PDF.countDocuments({ userId, isArchived: true }),
        PDF.countDocuments({ userId, isFavorite: true }),
        PDF.countDocuments({ userId, isPublic: true }),
        PDF.aggregate([
          { $match: { userId } },
          { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
        ]),
        PDF.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('uuid displayName createdAt fileSize'),
        PDF.aggregate([
          { $match: { userId } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),
        PDF.aggregate([
          { $match: { userId } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalPDFs,
            archivedPDFs,
            favoritePDFs,
            publicPDFs,
            totalSize: totalSize[0]?.totalSize || 0
          },
          recentPDFs,
          insights: {
            popularCategories: popularCategories.map(cat => ({
              category: cat._id || 'uncategorized',
              count: cat.count
            })),
            popularTags: popularTags.map(tag => ({
              tag: tag._id,
              count: tag.count
            }))
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get PDF stats',
        userId: req.user._id
      });
      next(error);
    }
  }
);

// MOVED UP: Search route BEFORE /:uuid
router.get('/search',
  protect,
  validate(pdfSchemas.pdfQuery, 'query'),
  async (req, res, next) => {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;

      if (!search || search.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }
      const query = PDF.find({
        userId: req.user._id,
        isArchived: false,
        $or: [
          { displayName: { $regex: search, $options: 'i' } },
          { textContent: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
          { 'metadata.title': { $regex: search, $options: 'i' } },
          { 'metadata.author': { $regex: search, $options: 'i' } }
        ]
      });

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      query.sort(sortOptions);
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);

      const pdfs = await query.exec();
      const total = await PDF.countDocuments({
        userId: req.user._id,
        isArchived: false,
        $or: [
          { displayName: { $regex: search, $options: 'i' } },
          { textContent: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
          { 'metadata.title': { $regex: search, $options: 'i' } },
          { 'metadata.author': { $regex: search, $options: 'i' } }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          pdfs: pdfs.map(pdf => pdf.getFullInfo()),
          searchQuery: search,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Search PDFs',
        userId: req.user._id,
        searchQuery: req.query.search
      });
      next(error);
    }
  }
);

// MOVED UP: Public route BEFORE /:uuid
router.get('/public',
  require('../middleware/auth').optionalAuth,
  validate(pdfSchemas.pdfQuery, 'query'),
  async (req, res, next) => {
    try {
      const { page, limit, search, sortBy, sortOrder } = req.query;

      const filters = { search };
      const query = PDF.findPublicPDFs(filters);
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      query.sort(sortOptions);
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);

      const pdfs = await query.exec();
      const total = await PDF.countDocuments({
        isPublic: true,
        isArchived: false,
        ...(search && {
          $or: [
            { displayName: { $regex: search, $options: 'i' } },
            { textContent: { $regex: search, $options: 'i' } }
          ]
        })
      });

      res.status(200).json({
        success: true,
        data: {
          pdfs: pdfs.map(pdf => ({
            ...pdf.getPublicInfo(),
            owner: {
              name: pdf.userId.name,
              avatar: pdf.userId.avatar
            }
          })),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get public PDFs',
        userId: req.user ? req.user._id : null
      });
      next(error);
    }
  }
);

// MOVED UP: Shared route BEFORE /:uuid
router.get('/shared',
  protect,
  validate(pdfSchemas.pdfQuery, 'query'),
  async (req, res, next) => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query;

      const query = PDF.find({
        'sharedWith.userId': req.user._id,
        isArchived: false
      }).populate('userId', 'name email avatar');
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      query.sort(sortOptions);
      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);

      const pdfs = await query.exec();
      const total = await PDF.countDocuments({
        'sharedWith.userId': req.user._id,
        isArchived: false
      });
      const pdfsWithSharingInfo = pdfs.map(pdf => {
        const shareInfo = pdf.sharedWith.find(
          share => share.userId.toString() === req.user._id.toString()
        );
        
        return {
          ...pdf.getPublicInfo(),
          owner: {
            name: pdf.userId.name,
            email: pdf.userId.email,
            avatar: pdf.userId.avatar
          },
          sharedPermission: shareInfo.permission,
          sharedAt: shareInfo.sharedAt
        };
      });

      res.status(200).json({
        success: true,
        data: {
          pdfs: pdfsWithSharingInfo,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get shared PDFs',
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.get('/:uuid/file',
  protect,
  validate(uuidSchema, 'params'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }

      if (!pdf.hasAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const filePath = path.join(__dirname, '..',  pdf.filePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'PDF file not found on server'
        });
      }

      // Set correct headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf.displayName}.pdf"`);
      res.setHeader('Content-Length', pdf.fileSize);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error streaming PDF'
          });
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Stream PDF file',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);


// NOW /:uuid routes can come
router.get('/:uuid',
  protect,
  validate(uuidSchema, 'params'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const pdf = await PDF.findOne({ uuid })
        .populate({
          path: 'highlights',
          match: { isDeleted: { $ne: true } },
          select: '-__v'
        });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (!pdf.hasAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      if (pdf.userId.toString() === req.user._id.toString()) {
        await pdf.incrementView();
      }

      res.status(200).json({
        success: true,
        data: {
          pdf: pdf.hasAccess(req.user._id, 'write') ? pdf.getFullInfo() : pdf.getPublicInfo(),
          highlights: pdf.highlights || []
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get PDF by UUID',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);



router.put('/:uuid',
  protect,
  validate(uuidSchema, 'params'),
  validate(pdfSchemas.updatePDF),
  logActivity('PDF update'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const updates = req.body;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (!pdf.hasAccess(req.user._id, 'write')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      Object.assign(pdf, updates);
      await pdf.save();
      logUserActivity(req.user._id, 'PDF updated', {
        pdfId: pdf._id,
        uuid,
        updates: Object.keys(updates),
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'PDF updated successfully',
        data: {
          pdf: pdf.getFullInfo()
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Update PDF',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.delete('/:uuid',
  protect,
  validate(uuidSchema, 'params'),
  logActivity('PDF deletion'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (pdf.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      const Highlight = require('../models/Highlight');
      await Highlight.deleteMany({ pdfId: pdf._id });
      if (pdf.filePath) {
        await deleteFile(pdf.filePath).catch(err => {
          logError(err, { operation: 'Delete PDF file', filePath: pdf.filePath });
        });
      }
      if (pdf.thumbnailPath) {
        await deleteFile(pdf.thumbnailPath).catch(err => {
          logError(err, { operation: 'Delete PDF thumbnail', filePath: pdf.thumbnailPath });
        });
      }
      await PDF.findByIdAndDelete(pdf._id);
      logUserActivity(req.user._id, 'PDF deleted', {
        pdfId: pdf._id,
        uuid,
        originalName: pdf.originalName,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'PDF deleted successfully'
      });

    } catch (error) {
      logError(error, {
        operation: 'Delete PDF',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.get('/:uuid/download',
  protect,
  validate(uuidSchema, 'params'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (!pdf.hasAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      if (!fs.existsSync(pdf.filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File not found on server'
        });
      }
      if (pdf.userId.toString() === req.user._id.toString()) {
        await pdf.incrementDownload();
      }
      logUserActivity(req.user._id, 'PDF downloaded', {
        pdfId: pdf._id,
        uuid,
        ip: req.ip
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName}"`);
      res.setHeader('Content-Length', pdf.fileSize);
      const fileStream = fs.createReadStream(pdf.filePath);
      fileStream.pipe(res);

    } catch (error) {
      logError(error, {
        operation: 'Download PDF',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.post('/:uuid/share',
  protect,
  validate(uuidSchema, 'params'),
  validate(pdfSchemas.sharePDF),
  logActivity('PDF sharing'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const { userEmail, permission } = req.body;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }      
      if (pdf.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the owner can share this PDF'
        });
      }
      const shareUser = await User.findByEmail(userEmail);
      if (!shareUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (shareUser._id.toString() === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot share with yourself'
        });
      }
      await pdf.shareWith(shareUser._id, permission, req.user._id);
      logUserActivity(req.user._id, 'PDF shared', {
        pdfId: pdf._id,
        uuid,
        sharedWithEmail: userEmail,
        permission,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'PDF shared successfully',
        data: {
          sharedWith: {
            name: shareUser.name,
            email: shareUser.email,
            permission
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Share PDF',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.delete('/:uuid/share/:userId',
  protect,
  validate(uuidSchema, 'params'),
  validate(idSchema, 'params'),
  logActivity('PDF share revocation'),
  async (req, res, next) => {
    try {
      const { uuid, userId } = req.params;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (pdf.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the owner can manage sharing'
        });
      }
      await pdf.revokeShare(userId);
      logUserActivity(req.user._id, 'PDF share revoked', {
        pdfId: pdf._id,
        uuid,
        revokedUserId: userId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'PDF sharing revoked successfully'
      });

    } catch (error) {
      logError(error, {
        operation: 'Revoke PDF sharing',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.post('/:uuid/favorite',
  protect,
  validate(uuidSchema, 'params'),
  logActivity('PDF favorite toggle'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (pdf.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      await pdf.toggleFavorite();
      logUserActivity(req.user._id, 'PDF favorite toggled', {
        pdfId: pdf._id,
        uuid,
        isFavorite: pdf.isFavorite,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: `PDF ${pdf.isFavorite ? 'added to' : 'removed from'} favorites`,
        data: {
          isFavorite: pdf.isFavorite
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Toggle PDF favorite',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.post('/:uuid/archive',
  protect,
  validate(uuidSchema, 'params'),
  logActivity('PDF archive toggle'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (pdf.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      await pdf.toggleArchive();
      logUserActivity(req.user._id, 'PDF archive toggled', {
        pdfId: pdf._id,
        uuid,
        isArchived: pdf.isArchived,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: `PDF ${pdf.isArchived ? 'archived' : 'unarchived'}`,
        data: {
          isArchived: pdf.isArchived,
          archivedAt: pdf.archivedAt
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Toggle PDF archive',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

router.get('/:uuid/status',
  protect,
  validate(uuidSchema, 'params'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const pdf = await PDF.findOne({ uuid });

      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }
      if (!pdf.hasAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          processingStatus: pdf.processingStatus,
          processingError: pdf.processingError,
          metadata: pdf.metadata,
          lastUpdated: pdf.updatedAt
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get PDF processing status',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

module.exports = router;