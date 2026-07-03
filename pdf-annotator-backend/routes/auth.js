const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const { protect, verifyRefreshToken, userRateLimit, logActivity } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');
const { logUserActivity, logSecurityEvent, logError } = require('../utils/logger');
const router = express.Router();
router.use(userRateLimit(20, 15 * 60 * 1000)); 
router.post('/register', 
  validate(authSchemas.register),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        logSecurityEvent('Registration attempt with existing email', {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email address'
        });
      }

      const user = await User.create({
        name,
        email,
        password
      });


      const token = user.getSignedJwtToken();
      const refreshToken = user.getRefreshToken();

    
      await user.save();

      logUserActivity(user._id, 'User registered', {
        email: user.email,
        name: user.name,
        ip: req.ip
      });


      const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res
        .status(201)
        .cookie('token', token, cookieOptions)
        .cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        })
        .json({
          success: true,
          message: 'User registered successfully',
          data: {
            user: user.getPublicProfile(),
            token,
            refreshToken
          }
        });

    } catch (error) {
      logError(error, {
        operation: 'User registration',
        email: req.body.email,
        ip: req.ip
      });
      next(error);
    }
  }
);


router.post('/login',
  validate(authSchemas.login),
  async (req, res, next) => {
    try {
      const { email, password, rememberMe } = req.body;

      const user = await User.findByEmail(email).select('+password');
      
      if (!user) {
        logSecurityEvent('Login attempt with non-existent email', {
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!user.isActive) {
        logSecurityEvent('Login attempt with deactivated account', {
          userId: user._id,
          email,
          ip: req.ip
        });
        
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      const isMatch = await user.matchPassword(password);
      
      if (!isMatch) {
        logSecurityEvent('Login attempt with wrong password', {
          userId: user._id,
          email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      user.updateLoginInfo();
      const token = user.getSignedJwtToken();
      const refreshToken = user.getRefreshToken();
      user.cleanExpiredRefreshTokens();
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }
      await user.save();
      logUserActivity(user._id, 'User logged in', {
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        rememberMe
      });

      const tokenExpiry = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const cookieOptions = {
        expires: new Date(Date.now() + tokenExpiry),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res
        .status(200)
        .cookie('token', token, cookieOptions)
        .cookie('refreshToken', refreshToken, {
          ...cookieOptions,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        })
        .json({
          success: true,
          message: 'Login successful',
          data: {
            user: user.getPublicProfile(),
            token,
            refreshToken
          }
        });

    } catch (error) {
      logError(error, {
        operation: 'User login',
        email: req.body.email,
        ip: req.ip
      });
      next(error);
    }
  }
);

router.post('/logout',
  protect,
  logActivity('User logout'),
  async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (refreshToken) {
        req.user.revokeRefreshToken(refreshToken);
        await req.user.save();
      }

      logUserActivity(req.user._id, 'User logged out', {
        email: req.user.email,
        ip: req.ip
      });

      res
        .status(200)
        .clearCookie('token')
        .clearCookie('refreshToken')
        .json({
          success: true,
          message: 'Logout successful'
        });

    } catch (error) {
      logError(error, {
        operation: 'User logout',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);

router.post('/logout-all',
  protect,
  logActivity('User logout from all devices'),
  async (req, res, next) => {
    try {
      req.user.revokeAllRefreshTokens();
      await req.user.save();
      logUserActivity(req.user._id, 'User logged out from all devices', {
        email: req.user.email,
        ip: req.ip
      });
      res
        .status(200)
        .clearCookie('token')
        .clearCookie('refreshToken')
        .json({
          success: true,
          message: 'Logged out from all devices successfully'
        });

    } catch (error) {
      logError(error, {
        operation: 'User logout from all devices',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);


router.post('/refresh-token',
  validate(authSchemas.refreshToken),
  verifyRefreshToken,
  async (req, res, next) => {
    try {
      const token = req.user.getSignedJwtToken();
      const newRefreshToken = req.user.getRefreshToken();
      req.user.revokeRefreshToken(req.refreshToken);
      await req.user.save();
      logUserActivity(req.user._id, 'Token refreshed', {
        email: req.user.email,
        ip: req.ip
      });

      const cookieOptions = {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res
        .status(200)
        .cookie('token', token, cookieOptions)
        .cookie('refreshToken', newRefreshToken, {
          ...cookieOptions,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
        })
        .json({
          success: true,
          message: 'Token refreshed successfully',
          data: {
            token,
            refreshToken: newRefreshToken,
            user: req.user.getPublicProfile()
          }
        });

    } catch (error) {
      logError(error, {
        operation: 'Token refresh',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);

router.get('/me',
  protect,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id)
        .populate({
          path: 'pdfs',
          select: 'uuid displayName fileSize createdAt',
          options: { limit: 5, sort: { createdAt: -1 } }
        });

      res.status(200).json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          recentPDFs: user.pdfs
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Get current user',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);

router.put('/profile',
  protect,
  validate(require('../middleware/validation').userSchemas.updateProfile),
  logActivity('User profile update'),
  async (req, res, next) => {
    try {
      const { name, preferences } = req.body;

      const updateFields = {};
      if (name) updateFields.name = name;
      if (preferences) updateFields.preferences = { ...req.user.preferences, ...preferences };

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updateFields,
        { new: true, runValidators: true }
      );
      logUserActivity(req.user._id, 'Profile updated', {
        email: req.user.email,
        updatedFields: Object.keys(updateFields),
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.getPublicProfile()
        }
      });

    } catch (error) {
      logError(error, {
        operation: 'Update user profile',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);
router.put('/change-password',
  protect,
  validate(authSchemas.changePassword),
  logActivity('Password change'),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        logSecurityEvent('Invalid current password during password change', {
          userId: req.user._id,
          email: req.user.email,
          ip: req.ip
        });

        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
      user.password = newPassword;
      user.revokeAllRefreshTokens();

      await user.save();
      logUserActivity(req.user._id, 'Password changed', {
        email: req.user.email,
        ip: req.ip
      });
      res
        .status(200)
        .clearCookie('token')
        .clearCookie('refreshToken')
        .json({
          success: true,
          message: 'Password changed successfully. Please login again.'
        });

    } catch (error) {
      logError(error, {
        operation: 'Change password',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);

router.post('/forgot-password',
  validate(authSchemas.forgotPassword),
  async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset email has been sent'
        });
      }

      const resetToken = user.getResetPasswordToken();
      await user.save();

      logUserActivity(user._id, 'Password reset requested', {
        email: user.email,
        ip: req.ip
      });

      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          message: 'Password reset token generated',
          resetToken 
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });

    } catch (error) {
      logError(error, {
        operation: 'Forgot password',
        email: req.body.email,
        ip: req.ip
      });
      next(error);
    }
  }
);
router.put('/reset-password',
  validate(authSchemas.resetPassword),
  async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.revokeAllRefreshTokens();
      await user.save();
      logUserActivity(user._id, 'Password reset completed', {
        email: user.email,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });

    } catch (error) {
      logError(error, {
        operation: 'Reset password',
        ip: req.ip
      });
      next(error);
    }
  }
);

router.get('/verify-email/:token',
  async (req, res, next) => {
    try {
      const { token } = req.params;
      const emailVerificationToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      const user = await User.findOne({
        emailVerificationToken
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;

      await user.save();
      logUserActivity(user._id, 'Email verified', {
        email: user.email,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });

    } catch (error) {
      logError(error, {
        operation: 'Email verification',
        ip: req.ip
      });
      next(error);
    }
  }
);

router.post('/resend-verification',
  protect,
  async (req, res, next) => {
    try {
      if (req.user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }
      const verificationToken = req.user.getEmailVerificationToken();
      await req.user.save();
      logUserActivity(req.user._id, 'Email verification resent', {
        email: req.user.email,
        ip: req.ip
      });

      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          message: 'Verification email sent',
          verificationToken 
        });
      }

      res.status(200).json({
        success: true,
        message: 'Verification email sent'
      });

    } catch (error) {
      logError(error, {
        operation: 'Resend email verification',
        userId: req.user._id,
        ip: req.ip
      });
      next(error);
    }
  }
);

module.exports = router;