const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PDFSchema = new mongoose.Schema({
  uuid: {
    type: String,
    unique: true,
    default: uuidv4,
    required: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [200, 'Display name cannot exceed 200 characters']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [1, 'File size must be at least 1 byte']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    enum: ['application/pdf']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  metadata: {
    pageCount: {
      type: Number,
      default: 0
    },
    title: String,
    author: String,
    subject: String,
    keywords: String,
    creator: String,
    producer: String,
    creationDate: Date,
    modificationDate: Date,
    pdfVersion: String,
    isEncrypted: {
      type: Boolean,
      default: false
    },
    hasForm: {
      type: Boolean,
      default: false
    },
    language: String
  },
  textContent: {
    type: String,
    default: '',
    index: 'text' // Text index for search functionality
  },
  extractedText: [{
    page: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    boundingBoxes: [{
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      text: String
    }]
  }],
  thumbnailPath: {
    type: String,
    default: null
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: {
    type: String,
    default: null
  },
  isPublic: {
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
      enum: ['read', 'write', 'admin'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    trim: true,
    default: 'uncategorized'
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  version: {
    type: Number,
    default: 1
  },
  checksum: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
PDFSchema.virtual('highlights', {
  ref: 'Highlight',
  localField: '_id',
  foreignField: 'pdfId'
});
PDFSchema.virtual('highlightCount', {
  ref: 'Highlight',
  localField: '_id',
  foreignField: 'pdfId',
  count: true
});

PDFSchema.pre('save', function(next) {
  
  if (!this.uuid) {
    this.uuid = uuidv4();
  }
  if (!this.displayName && this.originalName) {
    this.displayName = this.originalName.replace(/\.[^/.]+$/, ''); 
  }
  
  next();
});
PDFSchema.methods.incrementView = function() {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  return this.save();
};
PDFSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};
PDFSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this.save();
};
PDFSchema.methods.toggleArchive = function() {
  this.isArchived = !this.isArchived;
  this.archivedAt = this.isArchived ? new Date() : null;
  return this.save();
};
PDFSchema.methods.addTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
  }
  return this.save();
};
PDFSchema.methods.removeTag = function(tag) {
  const normalizedTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== normalizedTag);
  return this.save();
};

PDFSchema.methods.shareWith = function(userId, permission = 'read', sharedBy) {
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
      sharedBy,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};
PDFSchema.methods.revokeShare = function(userId) {
  this.sharedWith = this.sharedWith.filter(
    share => share.userId.toString() !== userId.toString()
  );
  return this.save();
};
PDFSchema.methods.hasAccess = function(userId, requiredPermission = 'read') {
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  if (this.isPublic && requiredPermission === 'read') {
    return true;
  }
  const share = this.sharedWith.find(
    s => s.userId.toString() === userId.toString()
  );
  
  if (!share) return false;
  
  const permissionLevels = { 'read': 1, 'write': 2, 'admin': 3 };
  const userLevel = permissionLevels[share.permission] || 0;
  const requiredLevel = permissionLevels[requiredPermission] || 0;
  
  return userLevel >= requiredLevel;
};
PDFSchema.statics.findByUserWithFilters = function(userId, filters = {}) {
  const query = { userId };
  if (filters.isArchived !== undefined) {
    query.isArchived = filters.isArchived;
  }
  
  if (filters.isFavorite !== undefined) {
    query.isFavorite = filters.isFavorite;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  if (filters.search) {
    query.$or = [
      { displayName: { $regex: filters.search, $options: 'i' } },
      { textContent: { $regex: filters.search, $options: 'i' } },
      { tags: { $in: [new RegExp(filters.search, 'i')] } }
    ];
  }
  
  return this.find(query);
};
PDFSchema.statics.findPublicPDFs = function(filters = {}) {
  const query = { isPublic: true, isArchived: false };
  
  if (filters.search) {
    query.$or = [
      { displayName: { $regex: filters.search, $options: 'i' } },
      { textContent: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query).populate('userId', 'name avatar');
};
PDFSchema.methods.getPublicInfo = function() {
  return {
    uuid: this.uuid,
    displayName: this.displayName,
    fileSize: this.fileSize,
    metadata: this.metadata,
    tags: this.tags,
    category: this.category,
    viewCount: this.viewCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};
PDFSchema.methods.getFullInfo = function() {
  return {
    uuid: this.uuid,
    originalName: this.originalName,
    displayName: this.displayName,
    fileName: this.fileName,
    fileSize: this.fileSize,
    mimeType: this.mimeType,
    metadata: this.metadata,
    processingStatus: this.processingStatus,
    isPublic: this.isPublic,
    sharedWith: this.sharedWith,
    tags: this.tags,
    category: this.category,
    isFavorite: this.isFavorite,
    viewCount: this.viewCount,
    lastViewedAt: this.lastViewedAt,
    downloadCount: this.downloadCount,
    isArchived: this.isArchived,
    archivedAt: this.archivedAt,
    version: this.version,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('PDF', PDFSchema);