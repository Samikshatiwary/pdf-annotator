const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/auth');
const cloudController = require('../controllers/cloudController');

// Google Drive
router.post('/google-drive/auth', protect, cloudController.googleDriveAuth);
router.post('/google-drive/callback', protect, cloudController.googleDriveCallback);
router.post('/google-drive/upload', protect, cloudController.uploadToGoogleDrive);
router.get('/google-drive/list', protect, cloudController.listGoogleDriveFiles);
router.post('/google-drive/import', protect, cloudController.importFromGoogleDrive);

// Dropbox
router.post('/dropbox/auth', protect, cloudController.dropboxAuth);
router.post('/dropbox/callback', protect, cloudController.dropboxCallback);
router.post('/dropbox/upload', protect, cloudController.uploadToDropbox);
router.get('/dropbox/list', protect, cloudController.listDropboxFiles);
router.post('/dropbox/import', protect, cloudController.importFromDropbox);

module.exports = router;