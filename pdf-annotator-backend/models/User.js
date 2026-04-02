const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    maxlength: [50, 'Name cannot be more than 50 characters'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    defaultHighlightColor: {
      type: String,
      default: '#ffff00'
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginCount: {
    type: Number,
    default: 0
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '7d'
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
UserSchema.virtual('pdfs', {
  ref: 'PDF',
  localField: '_id',
  foreignField: 'userId'
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '24h',
      issuer: 'pdf-annotator',
      audience: 'pdf-annotator-users'
    }
  );
};
UserSchema.methods.getRefreshToken = function() {
  const refreshToken = jwt.sign(
    { 
      id: this._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'pdf-annotator',
      audience: 'pdf-annotator-users'
    }
  );
  this.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date()
  });
  
  return refreshToken;
};
UserSchema.methods.revokeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(
    refreshToken => refreshToken.token !== token
  );
};
UserSchema.methods.revokeAllRefreshTokens = function() {
  this.refreshTokens = [];
};
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = require('crypto').randomBytes(20).toString('hex');
  this.resetPasswordToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};
UserSchema.methods.getEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(20).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  return verificationToken;
};
UserSchema.methods.updateLoginInfo = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
};
UserSchema.methods.cleanExpiredRefreshTokens = function() {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(
    refreshToken => {
      const tokenAge = now - refreshToken.createdAt;
      const maxAge = 7 * 24 * 60 * 60 * 1000; 
      return tokenAge < maxAge;
    }
  );
};
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};
UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};
UserSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    preferences: this.preferences,
    lastLogin: this.lastLogin,
    emailVerified: this.emailVerified,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', UserSchema);