const express = require('express');
const Highlight = require('../models/Highlight');
const PDF = require('../models/PDF');
const User = require('../models/User');
const { protect, userRateLimit, logActivity } = require('../middleware/auth');
const { validate, highlightSchemas, idSchema, uuidSchema } = require('../middleware/validation');
const { logUserActivity, logError } = require('../utils/logger');

const router = express.Router();
console.log('🔵 HIGHLIGHTS ROUTES FILE LOADED');

router.use(userRateLimit(100, 15 * 60 * 1000)); 

// CREATE HIGHLIGHT
router.post('/',
  protect,
  validate(highlightSchemas.createHighlight),
  logActivity('Highlight creation'),
  async (req, res, next) => {
    try {
      const highlightData = req.body;

      const pdf = await PDF.findOne({ uuid: highlightData.pdfId });  
      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }

      if (!pdf.hasAccess(req.user._id, 'write')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You do not have permission to add highlights to this PDF.'
        });
      }

      if (pdf.metadata?.pageCount && highlightData.pageNumber > pdf.metadata.pageCount) {
       return res.status(400).json({
       success: false,
       message: `Invalid page number. PDF has only ${pdf.metadata.pageCount} pages.`
      });
    }

      const highlight = new Highlight({
        ...highlightData,
        pdfId: pdf._id,
        userId: req.user._id,
        lastModifiedBy: req.user._id
      });

      await highlight.save();

      await highlight.populate('userId', 'name email avatar');

      logUserActivity(req.user._id, 'Highlight created', {
        highlightId: highlight._id,
        pdfId: pdf._id,
        pageNumber: highlight.pageNumber,
        ip: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Highlight created successfully',
        data: {
          highlight: highlight.toObject()
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Create highlight',
        userId: req.user._id,
        pdfId: req.body.pdfId
      });
      next(error);
    }
  }
);

// ========== STATIC ROUTES (MUST BE BEFORE /:uuid) ==========

// SEARCH HIGHLIGHTS
router.get('/search',
  protect,
  validate(highlightSchemas.highlightQuery, 'query'),
  async (req, res, next) => {
    try {
      const { search, page, limit, sortBy, sortOrder } = req.query;

      if (!search || search.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const query = Highlight.find({
        userId: req.user._id,
        isDeleted: { $ne: true },
        $or: [
          { highlightedText: { $regex: search, $options: 'i' } },
          { 'note.content': { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      }).populate('pdfId', 'uuid displayName');

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      query.sort(sortOptions);

      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);

      const highlights = await query.exec();
      const total = await Highlight.countDocuments({
        userId: req.user._id,
        isDeleted: { $ne: true },
        $or: [
          { highlightedText: { $regex: search, $options: 'i' } },
          { 'note.content': { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          highlights,
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
        operation: 'Search highlights',
        userId: req.user._id,
        searchQuery: req.query.search
      });
      next(error);
    }
  }
);

// GET MY HIGHLIGHTS
router.get('/my',
  protect,
  validate(highlightSchemas.highlightQuery, 'query'),
  async (req, res, next) => {
    try {
      const {
        page,
        limit,
        search,
        color,
        type,
        category,
        priority,
        isBookmark,
        tags,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder
      } = req.query;

      const filters = { userId: req.user._id };
      if (search) filters.search = search;
      if (color) filters.color = color;
      if (type) filters.type = type;
      if (category) filters.category = category;
      if (priority) filters.priority = priority;
      if (isBookmark !== undefined) filters.isBookmark = isBookmark;
      if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const query = Highlight.findWithFilters(filters);

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      query.sort(sortOptions);

      const skip = (page - 1) * limit;
      query.skip(skip).limit(limit);

      query.populate('pdfId', 'uuid displayName metadata.pageCount');

      const highlights = await query.exec();

      const totalQuery = Highlight.findWithFilters(filters);
      const total = await totalQuery.countDocuments();

      res.status(200).json({
        success: true,
        data: {
          highlights,
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
        operation: 'Get user highlights',
        userId: req.user._id
      });
      next(error);
    }
  }
);

// GET HIGHLIGHT STATS
router.get('/stats',
 protect,
  async (req, res, next) => {
    try {
      const userId = req.user._id;

      const totalHighlights = await Highlight.countDocuments({ userId, isDeleted: { $ne: true } });
      const bookmarkedHighlights = await Highlight.countDocuments({ userId, isBookmark: true, isDeleted: { $ne: true } });

      const highlightsByType = await Highlight.aggregate([
        { $match: { userId, isDeleted: { $ne: true } } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      const highlightsByPriority = await Highlight.aggregate([
        { $match: { userId, isDeleted: { $ne: true } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]);

      const recentHighlights = await Highlight.find({ userId, isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('pdfId', 'uuid displayName')
        .select('uuid highlightedText pageNumber createdAt')
        .lean();

      const popularTags = await Highlight.aggregate([
        { $match: { userId, isDeleted: { $ne: true }, tags: { $exists: true, $ne: [] } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      const popularCategories = await Highlight.aggregate([
        { $match: { userId, isDeleted: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalHighlights,
            bookmarkedHighlights,
            highlightsByType: (highlightsByType || []).map(item => ({
              type: item._id || 'highlight',
              count: item.count
            })),
            highlightsByPriority: (highlightsByPriority || []).map(item => ({
              priority: item._id || 'medium',
              count: item.count
            }))
          },
          recentHighlights: recentHighlights || [],
          insights: {
            popularTags: (popularTags || []).map(tag => ({
              tag: tag._id,
              count: tag.count
            })),
            popularCategories: (popularCategories || []).map(cat => ({
              category: cat._id || 'general',
              count: cat.count
            }))
          }
        }
      });

    } catch (error) {
      console.error('Highlights stats error:', error);
      logError(error, {
        operation: 'Get highlight stats',
        userId: req.user?._id
      });
      
      // Return empty stats instead of error
      res.status(200).json({
        success: true,
        data: {
          overview: {
            totalHighlights: 0,
            bookmarkedHighlights: 0,
            highlightsByType: [],
            highlightsByPriority: []
          },
          recentHighlights: [],
          insights: {
            popularTags: [],
            popularCategories: []
          }
        }
      });

    }
  }
);

// BULK OPERATIONS
router.post('/bulk',
  protect,
  logActivity('Bulk highlight operation'),
  async (req, res, next) => {
    try {
      const { action, highlightIds, data } = req.body;

      if (!action || !Array.isArray(highlightIds) || highlightIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Action and highlight IDs are required'
        });
      }

      const highlights = await Highlight.find({
        _id: { $in: highlightIds },
        userId: req.user._id,
        isDeleted: { $ne: true }
      });

      if (highlights.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No highlights found'
        });
      }

      let result = { processed: 0, errors: [] };

      switch (action) {
        case 'delete':
          for (const highlight of highlights) {
            try {
              await highlight.softDelete();
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        case 'updateCategory':
          if (!data?.category) {
            return res.status(400).json({
              success: false,
              message: 'Category is required for update operation'
            });
          }
          for (const highlight of highlights) {
            try {
              highlight.category = data.category;
              await highlight.save();
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        case 'addTags':
          if (!data?.tags || !Array.isArray(data.tags)) {
            return res.status(400).json({
              success: false,
              message: 'Tags array is required for add tags operation'
            });
          }
          for (const highlight of highlights) {
            try {
              for (const tag of data.tags) {
                await highlight.addTag(tag);
              }
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        case 'toggleBookmark':
          for (const highlight of highlights) {
            try {
              highlight.isBookmark = !highlight.isBookmark;
              await highlight.save();
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        case 'updatePriority':
          if (!data?.priority || !['low', 'medium', 'high', 'critical'].includes(data.priority)) {
            return res.status(400).json({
              success: false,
              message: 'Valid priority (low, medium, high, critical) is required'
            });
          }
          for (const highlight of highlights) {
            try {
              highlight.priority = data.priority;
              await highlight.save();
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        case 'updateColor':
          if (!data?.color || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(data.color)) {
            return res.status(400).json({
              success: false,
              message: 'Valid hex color is required'
            });
          }
          for (const highlight of highlights) {
            try {
              highlight.color = data.color;
              await highlight.save();
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        case 'removeTags':
          if (!data?.tags || !Array.isArray(data.tags)) {
            return res.status(400).json({
              success: false,
              message: 'Tags array is required for remove tags operation'
            });
          }
          for (const highlight of highlights) {
            try {
              for (const tag of data.tags) {
                await highlight.removeTag(tag);
              }
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        case 'restore':
          for (const highlight of highlights) {
            try {
              await highlight.restore();
              result.processed++;
            } catch (error) {
              result.errors.push({ highlightId: highlight._id, error: error.message });
            }
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action. Supported actions: delete, updateCategory, addTags, removeTags, toggleBookmark, updatePriority, updateColor, restore'
          });
      }

      logUserActivity(req.user._id, 'Bulk highlight operation', {
        action,
        highlightCount: highlightIds.length,
        processed: result.processed,
        errors: result.errors.length,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: `Bulk ${action} operation completed`,
        data: result
      });

    } catch (error) {
      logError(error, {
        operation: 'Bulk highlight operation',
        userId: req.user._id,
        action: req.body.action
      });
      next(error);
    }
  }
);

// EXPORT HIGHLIGHTS
router.get('/export',
  protect,
  logActivity('Highlights export'),
  async (req, res, next) => {
    try {
      const { format = 'json', pdfId } = req.query;

      const query = { userId: req.user._id, isDeleted: { $ne: true } };
      if (pdfId) query.pdfId = pdfId;

      const highlights = await Highlight.find(query)
        .populate('pdfId', 'uuid displayName originalName')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

      const exportData = {
        highlights: highlights.map(highlight => ({
          uuid: highlight.uuid,
          pdfInfo: {
            uuid: highlight.pdfId?.uuid,
            displayName: highlight.pdfId?.displayName,
            originalName: highlight.pdfId?.originalName
          },
          pageNumber: highlight.pageNumber,
          highlightedText: highlight.highlightedText,
          position: highlight.position,
          boundingBox: highlight.boundingBox,
          color: highlight.color,
          opacity: highlight.opacity,
          type: highlight.type,
          note: highlight.note,
          tags: highlight.tags,
          category: highlight.category,
          priority: highlight.priority,
          isBookmark: highlight.isBookmark,
          createdAt: highlight.createdAt,
          updatedAt: highlight.updatedAt
        })),
        exportedAt: new Date().toISOString(),
        exportedBy: {
          name: req.user.name,
          email: req.user.email
        },
        totalHighlights: highlights.length,
        version: '1.0'
      };

      logUserActivity(req.user._id, 'Highlights exported', {
        format,
        highlightCount: highlights.length,
        pdfId: pdfId || 'all',
        ip: req.ip
      });

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="highlights-export-${Date.now()}.json"`);
        res.status(200).json(exportData);
      } else if (format === 'csv') {
        const csvData = highlights.map(h => ({
          UUID: h.uuid,
          PDF: h.pdfId?.displayName || 'Unknown',
          Page: h.pageNumber,
          Text: h.highlightedText.replace(/"/g, '""'), 
          Color: h.color,
          Type: h.type,
          Note: h.note?.content || '',
          Tags: h.tags.join('; '),
          Category: h.category,
          Priority: h.priority,
          Bookmark: h.isBookmark ? 'Yes' : 'No',
          Created: h.createdAt.toISOString(),
          Updated: h.updatedAt.toISOString()
        }));

        const csvHeaders = Object.keys(csvData[0] || {});
        const csvRows = csvData.map(row => 
          csvHeaders.map(header => `"${row[header] || ''}"`)
        );
        
        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map(row => row.join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="highlights-export-${Date.now()}.csv"`);
        res.status(200).send(csvContent);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported export format. Supported formats: json, csv'
        });
      }

    } catch (error) {
      logError(error, {
        operation: 'Export highlights',
        userId: req.user._id
      });
      next(error);
    }
  }
);

// IMPORT HIGHLIGHTS
router.post('/import',
  protect,
  logActivity('Highlights import'),
  async (req, res, next) => {
    try {
      const { highlights, pdfId } = req.body;

      if (!Array.isArray(highlights) || highlights.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Highlights array is required'
        });
      }
      const pdf = await PDF.findById(pdfId);
      if (!pdf) {
        return res.status(404).json({
          success: false,
          message: 'PDF not found'
        });
      }

      if (!pdf.hasAccess(req.user._id, 'write')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to PDF'
        });
      }

      const importResults = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      for (const highlightData of highlights) {
        try {
          if (!highlightData.pageNumber || !highlightData.highlightedText || !highlightData.position) {
            importResults.errors.push({
              error: 'Missing required fields: pageNumber, highlightedText, position',
              data: highlightData
            });
            continue;
          }

          const existingHighlight = await Highlight.findOne({
            pdfId,
            userId: req.user._id,
            pageNumber: highlightData.pageNumber,
            highlightedText: highlightData.highlightedText,
            'position.x': highlightData.position.x,
            'position.y': highlightData.position.y,
            isDeleted: { $ne: true }
          });

          if (existingHighlight) {
            importResults.skipped++;
            continue;
          }
          const newHighlight = new Highlight({
            pdfId,
            userId: req.user._id,
            pageNumber: highlightData.pageNumber,
            highlightedText: highlightData.highlightedText,
            position: highlightData.position,
            boundingBox: highlightData.boundingBox || {
              x1: highlightData.position.x,
              y1: highlightData.position.y,
              x2: highlightData.position.x + highlightData.position.width,
              y2: highlightData.position.y + highlightData.position.height
            },
            color: highlightData.color || '#ffff00',
            opacity: highlightData.opacity || 0.3,
            type: highlightData.type || 'highlight',
            note: highlightData.note || {},
            tags: highlightData.tags || [],
            category: highlightData.category || 'general',
            priority: highlightData.priority || 'medium',
            isBookmark: highlightData.isBookmark || false,
            lastModifiedBy: req.user._id
          });

          await newHighlight.save();
          importResults.imported++;

        } catch (error) {
          importResults.errors.push({
            error: error.message,
            data: highlightData
          });
        }
      }
      logUserActivity(req.user._id, 'Highlights imported', {
        pdfId,
        totalHighlights: highlights.length,
        imported: importResults.imported,
        skipped: importResults.skipped,
        errors: importResults.errors.length,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Import completed',
        data: importResults
      });

    } catch (error) {
      logError(error, {
        operation: 'Import highlights',
        userId: req.user._id
      });
      next(error);
    }
  }
);

// ========== DYNAMIC ROUTES (/:uuid and /pdf/:pdfId) COME AFTER STATIC ROUTES ==========

// GET HIGHLIGHTS BY PDF ID
router.get('/pdf/:pdfId',
  protect,
  async (req, res, next) => {
    try {
      const { pdfId } = req.params;

      const pdf = await PDF.findOne({ uuid: pdfId }); 
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

      // Direct query instead of findWithFilters
      const highlights = await Highlight.find({
        pdfId: pdf._id,
        isDeleted: { $ne: true }
      })
      .populate('userId', 'name email avatar')
      .sort({ pageNumber: 1, createdAt: 1 })
      .lean();

      console.log(' Found highlights for PDF:', highlights.length);

      res.status(200).json({
        success: true,
        data: {
          highlights: highlights,
          pdf: pdf.getPublicInfo()
        }
      });

    } catch (error) {
      console.error(' Get PDF highlights error:', error);
      logError(error, {
        operation: 'Get PDF highlights',
        pdfId: req.params.pdfId,
        userId: req.user._id
      });
      next(error);

    }
  }
);

// GET HIGHLIGHT BY UUID
router.get('/:uuid',
  protect,
  validate(uuidSchema, 'params'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const highlight = await Highlight.findOne({ uuid })
        .populate('userId', 'name email avatar')
        .populate('pdfId', 'uuid displayName')
        .populate('replies.userId', 'name email avatar')
        .populate('reactions.userId', 'name email avatar');

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (!highlight.canAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          highlight: highlight.toObject()
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get highlight by UUID',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// UPDATE HIGHLIGHT
router.put('/:uuid',
  protect,
  validate(uuidSchema, 'params'),
  validate(highlightSchemas.updateHighlight),
  logActivity('Highlight update'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const updates = req.body;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (!highlight.canAccess(req.user._id, 'write')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      Object.assign(highlight, updates);
      highlight.lastModifiedBy = req.user._id;
      highlight.version += 1;

      await highlight.save();

      await highlight.populate('userId', 'name email avatar');

      logUserActivity(req.user._id, 'Highlight updated', {
        highlightId: highlight._id,
        uuid,
        updates: Object.keys(updates),
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Highlight updated successfully',
        data: {
          highlight: highlight.toObject()
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Update highlight',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// DELETE HIGHLIGHT
router.delete('/:uuid',
  protect,
  validate(uuidSchema, 'params'),
  logActivity('Highlight deletion'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (highlight.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only delete your own highlights.'
        });
      }

      await highlight.softDelete();

      logUserActivity(req.user._id, 'Highlight deleted', {
        highlightId: highlight._id,
        uuid,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Highlight deleted successfully'
      });

    } catch (error) {
      logError(error, {
        operation: 'Delete highlight',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// ADD REACTION
router.post('/:uuid/reactions',
  protect,
  validate(uuidSchema, 'params'),
  validate(highlightSchemas.addReaction),
  logActivity('Highlight reaction'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const { type } = req.body;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (!highlight.canAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await highlight.addReaction(req.user._id, type);

      await highlight.populate('reactions.userId', 'name email avatar');

      logUserActivity(req.user._id, 'Highlight reaction added', {
        highlightId: highlight._id,
        uuid,
        reactionType: type,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Reaction added successfully',
        data: {
          reactions: highlight.reactions,
          reactionCounts: highlight.reactionCounts
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Add highlight reaction',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// REMOVE REACTION
router.delete('/:uuid/reactions',
  protect,
  validate(uuidSchema, 'params'),
  logActivity('Highlight reaction removal'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (!highlight.canAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await highlight.removeReaction(req.user._id);

      logUserActivity(req.user._id, 'Highlight reaction removed', {
        highlightId: highlight._id,
        uuid,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Reaction removed successfully',
        data: {
          reactions: highlight.reactions,
          reactionCounts: highlight.reactionCounts
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Remove highlight reaction',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// ADD REPLY
router.post('/:uuid/replies',
  protect,
  validate(uuidSchema, 'params'),
  validate(highlightSchemas.addReply),
  logActivity('Highlight reply'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const { content } = req.body;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (!highlight.canAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await highlight.addReply(req.user._id, content);

      await highlight.populate('replies.userId', 'name email avatar');

      logUserActivity(req.user._id, 'Highlight reply added', {
        highlightId: highlight._id,
        uuid,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Reply added successfully',
        data: {
          replies: highlight.replies,
          replyCount: highlight.replyCount
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Add highlight reply',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// UPDATE REPLY
router.put('/:uuid/replies/:replyId',
  protect,
  validate(uuidSchema, 'params'),
  validate(idSchema, 'params'),
  validate(highlightSchemas.addReply),
  logActivity('Highlight reply update'),
  async (req, res, next) => {
    try {
      const { uuid, replyId } = req.params;
      const { content } = req.body;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      await highlight.updateReply(replyId, content, req.user._id);

      await highlight.populate('replies.userId', 'name email avatar');

      logUserActivity(req.user._id, 'Highlight reply updated', {
        highlightId: highlight._id,
        uuid,
        replyId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Reply updated successfully',
        data: {
          replies: highlight.replies,
          replyCount: highlight.replyCount
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Update highlight reply',
        uuid: req.params.uuid,
        replyId: req.params.replyId,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// DELETE REPLY
router.delete('/:uuid/replies/:replyId',
  protect,
  validate(uuidSchema, 'params'),
  validate(idSchema, 'params'),
  logActivity('Highlight reply deletion'),
  async (req, res, next) => {
    try {
      const { uuid, replyId } = req.params;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      await highlight.deleteReply(replyId, req.user._id);

      logUserActivity(req.user._id, 'Highlight reply deleted', {
        highlightId: highlight._id,
        uuid,
        replyId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Reply deleted successfully',
        data: {
          replies: highlight.replies,
          replyCount: highlight.replyCount
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Delete highlight reply',
        uuid: req.params.uuid,
        replyId: req.params.replyId,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// SHARE HIGHLIGHT
router.post('/:uuid/share',
  protect,
  validate(uuidSchema, 'params'),
  validate(highlightSchemas.shareHighlight),
  logActivity('Highlight sharing'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;
      const { userEmail, permission } = req.body;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (highlight.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the owner can share this highlight'
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

      await highlight.shareWith(shareUser._id, permission);

      logUserActivity(req.user._id, 'Highlight shared', {
        highlightId: highlight._id,
        uuid,
        sharedWithEmail: userEmail,
        permission,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Highlight shared successfully',
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
        operation: 'Share highlight',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// REVOKE SHARE
router.delete('/:uuid/share/:userId',
  protect,
  validate(uuidSchema, 'params'),
  validate(idSchema, 'params'),
  logActivity('Highlight share revocation'),
  async (req, res, next) => {
    try {
      const { uuid, userId } = req.params;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }

      if (highlight.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the owner can manage sharing'
        });
      }

      await highlight.revokeShare(userId);

      logUserActivity(req.user._id, 'Highlight share revoked', {
        highlightId: highlight._id,
        uuid,
        revokedUserId: userId,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Highlight sharing revoked successfully'
      });

    } catch (error) {
      logError(error, {
        operation: 'Revoke highlight sharing',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

// GET HIGHLIGHT ACTIVITY
router.get('/:uuid/activity',
  protect,
  validate(uuidSchema, 'params'),
  async (req, res, next) => {
    try {
      const { uuid } = req.params;

      const highlight = await Highlight.findOne({ uuid });

      if (!highlight) {
        return res.status(404).json({
          success: false,
          message: 'Highlight not found'
        });
      }
      if (!highlight.canAccess(req.user._id, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      const activities = [];
      activities.push({
        type: 'created',
        timestamp: highlight.createdAt,
        user: highlight.userId,
        description: 'Highlight created'
      });
      highlight.reactions.forEach(reaction => {
        activities.push({
          type: 'reaction',
          timestamp: reaction.createdAt,
          user: reaction.userId,
          description: `Reacted with ${reaction.type}`,
          metadata: { reactionType: reaction.type }
        });
      });
      highlight.replies.forEach(reply => {
        activities.push({
          type: 'reply',
          timestamp: reply.createdAt,
          user: reply.userId,
          description: 'Added a reply',
          metadata: { content: reply.content.substring(0, 100) }
        });

        if (reply.updatedAt && reply.updatedAt > reply.createdAt) {
          activities.push({
            type: 'reply_updated',
            timestamp: reply.updatedAt,
            user: reply.userId,
            description: 'Updated reply'
          });
        }
      });

      if (highlight.updatedAt > highlight.createdAt) {
        activities.push({
          type: 'updated',
          timestamp: highlight.updatedAt,
          user: highlight.lastModifiedBy,
          description: `Updated highlight (v${highlight.version})`
        });
      }

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const populatedActivities = await Promise.all(
        activities.map(async activity => {
          if (activity.user) {
            const user = await User.findById(activity.user).select('name email avatar');
            return {
              ...activity,
              user: user ? user.toObject() : null
            };
          }
          return activity;
        })
      );

      res.status(200).json({
        success: true,
        data: {
          highlight: {
            uuid: highlight.uuid,
            highlightedText: highlight.highlightedText.substring(0, 100),
            pageNumber: highlight.pageNumber
          },
          activities: populatedActivities
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get highlight activity',
        uuid: req.params.uuid,
        userId: req.user._id
      });
      next(error);
    }
  }
);

module.exports = router;