const express = require('express');
const User = require('../models/User');
const PDF = require('../models/PDF');
const Highlight = require('../models/Highlight');
const { protect, authorize, userRateLimit, logActivity } = require('../middleware/auth');
const { validate, userSchemas, idSchema } = require('../middleware/validation');
const { uploadAvatar, handleUploadError, deleteFile } = require('../utils/upload');
const { logUserActivity, logError } = require('../utils/logger');

const router = express.Router();
router.use(userRateLimit(30, 15 * 60 * 1000)); 
router.get('/dashboard',
  protect,
  async (req, res, next) => {
    try {
      const userId = req.user._id;

      // Get basic stats
      const totalPDFs = await PDF.countDocuments({ userId });
      const favoritePDFs = await PDF.countDocuments({ userId, isFavorite: true });
      const totalHighlights = await Highlight.countDocuments({ userId, isDeleted: { $ne: true } });
      
      // Get total size
      const sizeAgg = await PDF.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
      ]);
      const totalSize = sizeAgg[0]?.totalSize || 0;

      // Get recent activity counts
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentPDFsCount = await PDF.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo }
      });
      const recentHighlightsCount = await Highlight.countDocuments({
        userId,
        createdAt: { $gte: thirtyDaysAgo },
        isDeleted: { $ne: true }
      });

      // Get recent PDFs
      const recentPDFs = await PDF.find({ userId, isArchived: false })
        .sort({ lastViewedAt: -1, createdAt: -1 })
        .limit(5)
        .select('uuid displayName lastViewedAt createdAt fileSize metadata')
        .lean();

      // Get recent highlights
      const recentHighlights = await Highlight.find({ userId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('pdfId', 'uuid displayName')
        .select('uuid highlightedText pageNumber createdAt')
        .lean();

      // Get favorite categories
      const favoriteCategories = await PDF.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      res.status(200).json({
        success: true,
        data: {
          user: req.user.getPublicProfile(),
          statistics: {
            totalPDFs,
            favoritePDFs,
            totalHighlights,
            totalSize,
            recentActivity: {
              pdfsLast30Days: recentPDFsCount,
              highlightsLast30Days: recentHighlightsCount
            }
          },
          recentPDFs: recentPDFs || [],
          recentHighlights: recentHighlights || [],
          favoriteCategories: (favoriteCategories || []).map(cat => ({
            category: cat._id || 'uncategorized',
            count: cat.count
          }))
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get user dashboard',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.post('/avatar',
  protect,
  uploadAvatar,
  handleUploadError,
  logActivity('Avatar update'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded'
        });
      }

      const { filename, path: filePath } = req.file;
      if (req.user.avatar) {
        const oldAvatarPath = require('path').join(
          process.env.UPLOAD_DIR || './uploads',
          'avatars',
          require('path').basename(req.user.avatar)
        );
        await deleteFile(oldAvatarPath).catch(() => {});
      }
      const avatarUrl = `/uploads/avatars/${filename}`;
      req.user.avatar = avatarUrl;
      await req.user.save();
      logUserActivity(req.user._id, 'Avatar updated', {
        filename,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Avatar updated successfully',
        data: {
          avatar: avatarUrl,
          user: req.user.getPublicProfile()
        }
      });

    } catch (error) {
      if (req.file) {
        await deleteFile(req.file.path).catch(() => {});
      }

      logError(error, {
        operation: 'Update avatar',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.delete('/avatar',
  protect,
  logActivity('Avatar deletion'),
  async (req, res, next) => {
    try {
      if (req.user.avatar) {
        const avatarPath = require('path').join(
          process.env.UPLOAD_DIR || './uploads',
          'avatars',
          require('path').basename(req.user.avatar)
        );
        await deleteFile(avatarPath).catch(() => {});
      }
      req.user.avatar = null;
      await req.user.save();
      logUserActivity(req.user._id, 'Avatar deleted', {
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Avatar deleted successfully',
        data: {
          user: req.user.getPublicProfile()
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Delete avatar',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.get('/activity',
  protect,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, dateFrom, dateTo, type } = req.query;
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter.createdAt = {};
        if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
      }
      const [pdfActivities, highlightActivities] = await Promise.all([
        PDF.find({
          userId: req.user._id,
          ...dateFilter
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .select('uuid displayName createdAt updatedAt')
          .lean(),
        Highlight.find({
          userId: req.user._id,
          isDeleted: { $ne: true },
          ...dateFilter
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('pdfId', 'uuid displayName')
          .select('uuid highlightedText pageNumber createdAt updatedAt')
          .lean()
      ]);
      const activities = [
        ...pdfActivities.map(pdf => ({
          id: pdf._id,
          type: 'pdf_upload',
          title: `Uploaded "${pdf.displayName}"`,
          description: 'PDF document uploaded',
          timestamp: pdf.createdAt,
          metadata: {
            pdfUuid: pdf.uuid,
            pdfName: pdf.displayName
          }
        })),
        ...highlightActivities.map(highlight => ({
          id: highlight._id,
          type: 'highlight_created',
          title: `Created highlight on page ${highlight.pageNumber}`,
          description: highlight.highlightedText.substring(0, 100) + '...',
          timestamp: highlight.createdAt,
          metadata: {
            highlightUuid: highlight.uuid,
            pdfUuid: highlight.pdfId?.uuid,
            pdfName: highlight.pdfId?.displayName,
            pageNumber: highlight.pageNumber
          }
        }))
      ];
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice((page - 1) * limit, page * limit);

      res.status(200).json({
        success: true,
        data: {
          activities: sortedActivities,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: activities.length,
            pages: Math.ceil(activities.length / limit)
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get user activity',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.get('/preferences',
  protect,
  async (req, res, next) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          preferences: req.user.preferences
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get user preferences',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.put('/preferences',
  protect,
  validate(userSchemas.updateProfile),
  logActivity('Preferences update'),
  async (req, res, next) => {
    try {
      const { preferences } = req.body;

      if (!preferences) {
        return res.status(400).json({
          success: false,
          message: 'Preferences data is required'
        });
      }
      req.user.preferences = {
        ...req.user.preferences,
        ...preferences
      };

      await req.user.save();
      logUserActivity(req.user._id, 'Preferences updated', {
        updatedFields: Object.keys(preferences),
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences: req.user.preferences
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Update user preferences',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.get('/export',
  protect,
  logActivity('Data export'),
  async (req, res, next) => {
    try {
      const { format = 'json' } = req.query;
      const [user, pdfs, highlights] = await Promise.all([
        User.findById(req.user._id).select('-password -refreshTokens'),
        PDF.find({ userId: req.user._id }),
        Highlight.find({ userId: req.user._id, isDeleted: { $ne: true } })
          .populate('pdfId', 'uuid displayName')
      ]);

      const exportData = {
        user: user.getPublicProfile(),
        pdfs: pdfs.map(pdf => ({
          ...pdf.getFullInfo(),
          filePath: undefined 
        })),
        highlights: highlights.map(highlight => highlight.toObject()),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      logUserActivity(req.user._id, 'Data exported', {
        format,
        pdfCount: pdfs.length,
        highlightCount: highlights.length,
        ip: req.ip
      });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-data-${req.user._id}.json"`);
        res.status(200).json(exportData);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format. Only JSON is currently supported.'
        });
      }

    } catch (error) {
      logError(error, {
        operation: 'Export user data',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.delete('/account',
  protect,
  logActivity('Account deletion'),
  async (req, res, next) => {
    try {
      const { confirmPassword } = req.body;

      if (!confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation is required to delete account'
        });
      }
      const user = await User.findById(req.user._id).select('+password');
      const isMatch = await user.matchPassword(confirmPassword);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
      }
      const userPDFs = await PDF.find({ userId: req.user._id });
      await Highlight.deleteMany({ userId: req.user._id });
      for (const pdf of userPDFs) {
        if (pdf.filePath) {
          await deleteFile(pdf.filePath).catch(() => {});
        }
        if (pdf.thumbnailPath) {
          await deleteFile(pdf.thumbnailPath).catch(() => {});
        }
      }
      await PDF.deleteMany({ userId: req.user._id });
      if (user.avatar) {
        const avatarPath = require('path').join(
          process.env.UPLOAD_DIR || './uploads',
          'avatars',
          require('path').basename(user.avatar)
        );
        await deleteFile(avatarPath).catch(() => {});
      }

      logUserActivity(req.user._id, 'Account deleted', {
        email: user.email,
        pdfCount: userPDFs.length,
        ip: req.ip
      });
      await User.findByIdAndDelete(req.user._id);

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      logError(error, {
        operation: 'Delete user account',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.get('/storage',
  protect,
  async (req, res, next) => {
    try {
      const storageStats = await PDF.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: null,
            totalSize: { $sum: '$fileSize' },
            totalFiles: { $sum: 1 },
            avgFileSize: { $avg: '$fileSize' },
            maxFileSize: { $max: '$fileSize' },
            minFileSize: { $min: '$fileSize' }
          }
        }
      ]);

      const stats = storageStats[0] || {
        totalSize: 0,
        totalFiles: 0,
        avgFileSize: 0,
        maxFileSize: 0,
        minFileSize: 0
      };
      const categoryBreakdown = await PDF.aggregate([
        { $match: { userId: req.user._id } },
        {
          $group: {
            _id: '$category',
            size: { $sum: '$fileSize' },
            count: { $sum: 1 }
          }
        },
        { $sort: { size: -1 } }
      ]);
      const monthlyTrend = await PDF.aggregate([
        {
          $match: {
            userId: req.user._id,
            createdAt: {
              $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            size: { $sum: '$fileSize' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalSize: stats.totalSize,
            totalFiles: stats.totalFiles,
            averageFileSize: Math.round(stats.avgFileSize || 0),
            largestFile: stats.maxFileSize,
            smallestFile: stats.minFileSize
          },
          categoryBreakdown: categoryBreakdown.map(cat => ({
            category: cat._id || 'uncategorized',
            size: cat.size,
            count: cat.count,
            percentage: Math.round((cat.size / stats.totalSize) * 100) || 0
          })),
          monthlyTrend: monthlyTrend.map(month => ({
            year: month._id.year,
            month: month._id.month,
            size: month.size,
            count: month.count
          }))
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get user storage',
        userId: req.user._id
      });
      next(error);
    }
  }
);
router.get('/search',
  protect,
  authorize('admin'),
  async (req, res, next) => {
    try {
      const { query, page = 1, limit = 10 } = req.query;

      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const searchQuery = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      };

      const users = await User.find(searchQuery)
        .select('-password -refreshTokens')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await User.countDocuments(searchQuery);

      res.status(200).json({
        success: true,
        data: {
          users: users.map(user => user.getPublicProfile()),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Search users',
        userId: req.user._id,
        searchQuery: req.query.query
      });
      next(error);
    }
  }
);
router.get('/:id',
  protect,
  authorize('admin'),
  validate(idSchema, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id)
        .select('-password -refreshTokens')
        .populate({
          path: 'pdfs',
          select: 'uuid displayName createdAt fileSize',
          options: { limit: 10, sort: { createdAt: -1 } }
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      const [pdfCount, highlightCount, totalSize] = await Promise.all([
        PDF.countDocuments({ userId: id }),
        Highlight.countDocuments({ userId: id, isDeleted: { $ne: true } }),
        PDF.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
        ])
      ]);

      res.status(200).json({
        success: true,
        data: {
          user: {
            ...user.getPublicProfile(),
            statistics: {
              pdfCount,
              highlightCount,
              totalSize: totalSize[0]?.totalSize || 0
            }
          },
          recentPDFs: user.pdfs
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get user by ID',
        targetUserId: req.params.id,
        adminUserId: req.user._id
      });
      next(error);
    }
  }
);
router.put('/:id/status',
  protect,
  authorize('admin'),
  validate(idSchema, 'params'),
  logActivity('User status update'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      if (id === req.user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change your own account status'
        });
      }

      user.isActive = isActive;
      await user.save();
      logUserActivity(req.user._id, 'User status changed', {
        targetUserId: id,
        targetUserEmail: user.email,
        newStatus: isActive ? 'active' : 'inactive',
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          user: user.getPublicProfile()
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Update user status',
        targetUserId: req.params.id,
        adminUserId: req.user._id
      });
      next(error);
    }
  }
);

module.exports = router;