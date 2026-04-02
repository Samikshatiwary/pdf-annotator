const Joi = require('joi');
const logger = require('../utils/logger');
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      }));

      logger.warn('Validation error:', {
        errors: errorDetails,
        url: req.url,
        method: req.method,
        user: req.user ? req.user.email : 'Anonymous'
      });

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        errors: errorDetails
      });
    }
    req[property] = value;
    next();
  };
};


const authSchemas = {
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Password confirmation is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      }),
    rememberMe: Joi.boolean().default(false)
  }),

  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      })
  }),

  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Reset token is required'
      }),
    password: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'any.required': 'Password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Password confirmation is required'
      })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(6)
      .max(128)
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'any.required': 'New password is required'
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Passwords must match',
        'any.required': 'Password confirmation is required'
      })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token is required'
      })
  })
};

const pdfSchemas = {
  updatePDF: Joi.object({
    displayName: Joi.string()
      .min(1)
      .max(200)
      .trim()
      .optional()
      .messages({
        'string.min': 'Display name cannot be empty',
        'string.max': 'Display name cannot exceed 200 characters'
      }),
    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(20)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 20 tags'
      }),
    category: Joi.string()
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.max': 'Category cannot exceed 100 characters'
      }),
    isPublic: Joi.boolean().optional(),
    isFavorite: Joi.boolean().optional()
  }),

  sharePDF: Joi.object({
    userEmail: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'User email is required'
      }),
    permission: Joi.string()
      .valid('read', 'write', 'admin')
      .default('read')
      .messages({
        'any.only': 'Permission must be read, write, or admin'
      })
  }),

  pdfQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(200).optional(),
    category: Joi.string().max(100).optional(),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional(),
    isArchived: Joi.boolean().optional(),
    isFavorite: Joi.boolean().optional(),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'displayName', 'fileSize', 'viewCount')
      .default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

const highlightSchemas = {
  createHighlight: Joi.object({
    pdfId: Joi.string()
      .uuid({ version: 'uuidv4' })
      .required()
      .messages({
        'string.pattern.base': 'Invalid PDF ID format',
        'any.required': 'PDF ID is required'
      }),
    pageNumber: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.min': 'Page number must be at least 1',
        'any.required': 'Page number is required'
      }),
    highlightedText: Joi.string()
      .min(1)
      .max(5000)
      .trim()
      .required()
      .messages({
        'string.min': 'Highlighted text cannot be empty',
        'string.max': 'Highlighted text cannot exceed 5000 characters',
        'any.required': 'Highlighted text is required'
      }),
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      width: Joi.number().min(0).required(),
      height: Joi.number().min(0).required()
    }).required(),
    boundingBox: Joi.object({
      x1: Joi.number().required(),
      y1: Joi.number().required(),
      x2: Joi.number().required(),
      y2: Joi.number().required()
    }).required(),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .default('#ffff00')
      .messages({
        'string.pattern.base': 'Color must be a valid hex color'
      }),
    opacity: Joi.number()
      .min(0)
      .max(1)
      .default(0.3)
      .messages({
        'number.min': 'Opacity must be between 0 and 1',
        'number.max': 'Opacity must be between 0 and 1'
      }),
    type: Joi.string()
      .valid('highlight', 'underline', 'strikethrough', 'squiggly')
      .default('highlight'),
    note: Joi.object({
      content: Joi.string().max(2000).trim().optional(),
      isPrivate: Joi.boolean().default(true)
    }).optional(),
    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional(),
    category: Joi.string()
      .max(100)
      .trim()
      .default('general'),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .default('medium'),
    isBookmark: Joi.boolean().default(false),
    metadata: Joi.object({
      browser: Joi.string().optional(),
      device: Joi.string().optional(),
      viewport: Joi.object({
        width: Joi.number().optional(),
        height: Joi.number().optional()
      }).optional(),
      zoom: Joi.number().default(1),
      selectionMethod: Joi.string()
        .valid('mouse', 'touch', 'keyboard')
        .default('mouse')
    }).optional()
  }),

  updateHighlight: Joi.object({
    highlightedText: Joi.string()
      .min(1)
      .max(5000)
      .trim()
      .optional(),
    position: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
      width: Joi.number().min(0).required(),
      height: Joi.number().min(0).required()
    }).optional(),
    boundingBox: Joi.object({
      x1: Joi.number().required(),
      y1: Joi.number().required(),
      x2: Joi.number().required(),
      y2: Joi.number().required()
    }).optional(),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional(),
    opacity: Joi.number().min(0).max(1).optional(),
    type: Joi.string()
      .valid('highlight', 'underline', 'strikethrough', 'squiggly')
      .optional(),
    note: Joi.object({
      content: Joi.string().max(2000).trim().allow(''),
      isPrivate: Joi.boolean().optional()
    }).optional(),
    tags: Joi.array()
      .items(Joi.string().trim().max(50))
      .max(10)
      .optional(),
    category: Joi.string().max(100).trim().optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .optional(),
    isBookmark: Joi.boolean().optional()
  }),

  highlightQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(10000).default(50),
    pageNumber: Joi.number().integer().min(1).optional(),
    search: Joi.string().max(200).optional(),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional(),
    type: Joi.string()
      .valid('highlight', 'underline', 'strikethrough', 'squiggly')
      .optional(),
    category: Joi.string().max(100).optional(),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'critical')
      .optional(),
    isBookmark: Joi.boolean().optional(),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional(),
    dateFrom: Joi.date().iso().optional(),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).optional(),
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'pageNumber', 'priority')
      .default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  addReaction: Joi.object({
    type: Joi.string()
      .valid('like', 'dislike', 'love', 'laugh', 'angry', 'sad')
      .required()
      .messages({
        'any.only': 'Reaction type must be like, dislike, love, laugh, angry, or sad',
        'any.required': 'Reaction type is required'
      })
  }),

  addReply: Joi.object({
    content: Joi.string()
      .min(1)
      .max(1000)
      .trim()
      .required()
      .messages({
        'string.min': 'Reply content cannot be empty',
        'string.max': 'Reply content cannot exceed 1000 characters',
        'any.required': 'Reply content is required'
      })
  }),

  shareHighlight: Joi.object({
    userEmail: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'User email is required'
      }),
    permission: Joi.string()
      .valid('read', 'write')
      .default('read')
      .messages({
        'any.only': 'Permission must be read or write'
      })
  })
};

const userSchemas = {
  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters'
      }),
    preferences: Joi.object({
      theme: Joi.string().valid('light', 'dark').optional(),
      defaultHighlightColor: Joi.string()
        .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .optional(),
      autoSave: Joi.boolean().optional()
    }).optional()
  }),

  uploadAvatar: Joi.object({
    avatar: Joi.string().uri().optional()
  })
};


const idSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});

const uuidSchema = Joi.object({
  uuid: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Invalid UUID format',
      'any.required': 'UUID is required'
    })
});

module.exports = {
  validate,
  authSchemas,
  pdfSchemas,
  highlightSchemas,
  userSchemas,
  idSchema,
  uuidSchema
};