const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const HighlightSchema = new mongoose.Schema({
  uuid: {
    type: String,
    unique: true,
    default: uuidv4,
    required: true
  },
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PDF',
    required: [true, 'PDF ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  pageNumber: {
    type: Number,
    required: [true, 'Page number is required'],
    min: [1, 'Page number must be at least 1']
  },
  highlightedText: {
    type: String,
    required: [true, 'Highlighted text is required'],
    trim: true,
    maxlength: [5000, 'Highlighted text cannot exceed 5000 characters']
  },
  position: {
    x: {
      type: Number,
      required: [true, 'X position is required']
    },
    y: {
      type: Number,
      required: [true, 'Y position is required']
    },
    width: {
      type: Number,
      required: [true, 'Width is required']
    },
    height: {
      type: Number,
      required: [true, 'Height is required']
    }
  },
  boundingBox: {
    x1: {
      type: Number,
      required: true
    },
    y1: {
      type: Number,
      required: true
    },
    x2: {
      type: Number,
      required: true
    },
    y2: {
      type: Number,
      required: true
    }
  },
  color: {
    type: String,
    default: '#ffff00',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  opacity: {
    type: Number,
    default: 0.3,
    min: [0, 'Opacity must be between 0 and 1'],
    max: [1, 'Opacity must be between 0 and 1']
  },
  type: {
    type: String,
    enum: ['highlight', 'underline', 'strikethrough', 'squiggly'],
    default: 'highlight'
  },
  note: {
    content: {
      type: String,
      trim: true,
      maxlength: [2000, 'Note cannot exceed 2000 characters']
    },
    isPrivate: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  category: {
    type: String,
    trim: true,
    default: 'general',
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  isBookmark: {
    type: Boolean,
    default: false
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'dislike', 'love', 'laugh', 'angry', 'sad'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    browser: String,
    device: String,
    viewport: {
      width: Number,
      height: Number
    },
    zoom: {
      type: Number,
      default: 1
    },
    selectionMethod: {
      type: String,
      enum: ['mouse', 'touch', 'keyboard'],
      default: 'mouse'
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});




HighlightSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.type] = (counts[reaction.type] || 0) + 1;
  });
  return counts;
});

HighlightSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

HighlightSchema.pre('save', function(next) {

  if (!this.uuid) {
    this.uuid = uuidv4();
  }

  if (this.isModified('note.content')) {
    this.note.updatedAt = new Date();
  }
  
  if (!this.lastModifiedBy && this.userId) {
    this.lastModifiedBy = this.userId;
  }
  
  next();
});


HighlightSchema.methods.addTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
  }
  return this.save();
};


HighlightSchema.methods.removeTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== normalizedTag);
  return this.save();
};


HighlightSchema.methods.addReaction = function(userId, type) {
 
  this.reactions = this.reactions.filter(
    reaction => reaction.userId.toString() !== userId.toString()
  );
  
 
  this.reactions.push({
    userId,
    type,
    createdAt: new Date()
  });
  
  return this.save();
};


HighlightSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.userId.toString() !== userId.toString()
  );
  return this.save();
};

HighlightSchema.methods.addReply = function(userId, content) {
  this.replies.push({
    userId,
    content: content.trim(),
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return this.save();
};

HighlightSchema.methods.updateReply = function(replyId, content, userId) {
  const reply = this.replies.id(replyId);
  if (!reply) {
    throw new Error('Reply not found');
  }
  

  if (reply.userId.toString() !== userId.toString()) {
    throw new Error('Not authorized to update this reply');
  }
  
  reply.content = content.trim();
  reply.updatedAt = new Date();
  
  return this.save();
};


HighlightSchema.methods.deleteReply = function(replyId, userId) {
  const reply = this.replies.id(replyId);
  if (!reply) {
    throw new Error('Reply not found');
  }

  if (reply.userId.toString() !== userId.toString()) {
    throw new Error('Not authorized to delete this reply');
  }
  
  this.replies.pull(replyId);
  return this.save();
};
HighlightSchema.methods.shareWith = function(userId, permission = 'read') {
  const existingShare = this.sharedWith.find(
    share => share.userId.toString() === userId.toString()
  );
  
  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      userId,
      permission,
      sharedAt: new Date()
    });
  }
  
  this.isShared = this.sharedWith.length > 0;
  return this.save();
};


HighlightSchema.methods.revokeShare = function(userId) {
  this.sharedWith = this.sharedWith.filter(
    share => share.userId.toString() !== userId.toString()
  );
  this.isShared = this.sharedWith.length > 0;
  return this.save();
};


HighlightSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

HighlightSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};


HighlightSchema.methods.canAccess = function(userId, requiredPermission = 'read') {
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  
  const share = this.sharedWith.find(
    s => s.userId.toString() === userId.toString()
  );
  
  if (!share) return false;
  
  if (requiredPermission === 'read') return true;
  if (requiredPermission === 'write') return share.permission === 'write';
  
  return false;
};
HighlightSchema.statics.findByPDFAndUser = function(pdfId, userId, includeDeleted = false) {
  const query = { pdfId, userId };
  
  if (!includeDeleted) {
    query.isDeleted = { $ne: true };
  }
  
  return this.find(query).sort({ pageNumber: 1, createdAt: 1 });
};

HighlightSchema.statics.findWithFilters = function(filters = {}) {
  const query = { isDeleted: { $ne: true } };
  
  if (filters.pdfId) query.pdfId = filters.pdfId;
  if (filters.userId) query.userId = filters.userId;
  if (filters.pageNumber) query.pageNumber = filters.pageNumber;
  if (filters.color) query.color = filters.color;
  if (filters.type) query.type = filters.type;
  if (filters.category) query.category = filters.category;
  if (filters.priority) query.priority = filters.priority;
  if (filters.isBookmark !== undefined) query.isBookmark = filters.isBookmark;
  
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  if (filters.search) {
    query.$or = [
      { highlightedText: { $regex: filters.search, $options: 'i' } },
      { 'note.content': { $regex: filters.search, $options: 'i' } },
      { tags: { $in: [new RegExp(filters.search, 'i')] } }
    ];
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query);
};

HighlightSchema.methods.getPublicInfo = function() {
  return {
    uuid: this.uuid,
    pageNumber: this.pageNumber,
    highlightedText: this.highlightedText,
    position: this.position,
    boundingBox: this.boundingBox,
    color: this.color,
    opacity: this.opacity,
    type: this.type,
    tags: this.tags,
    category: this.category,
    priority: this.priority,
    isBookmark: this.isBookmark,
    reactionCounts: this.reactionCounts,
    replyCount: this.replyCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Highlight', HighlightSchema);