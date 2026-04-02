const { google } = require('googleapis');
const { Dropbox } = require('dropbox');
const fs = require('fs');
const path = require('path');
const PDF = require('../models/PDF');

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

exports.googleDriveAuth = async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/drive.file'],
      prompt: 'consent'
    });

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    console.error('Google Drive auth error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.googleDriveCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code required' });
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    res.json({
      success: true,
      data: { 
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('Google Drive token exchange error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadToGoogleDrive = async (req, res) => {
  try {
    const { pdfId, accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token required' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const pdf = await PDF.findOne({ uuid: pdfId, userId: req.user._id });
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    const fullPath = path.join(__dirname, '..', pdf.filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server' });
    }

    const fileMetadata = {
      name: pdf.displayName || pdf.originalName || 'document.pdf',
    };

    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(fullPath),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    res.json({
      success: true,
      message: 'File uploaded to Google Drive',
      data: {
        fileId: file.data.id,
        name: file.data.name,
        link: file.data.webViewLink
      }
    });
  } catch (error) {
    console.error('Google Drive upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listGoogleDriveFiles = async (req, res) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token required' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.list({
      pageSize: 50,
      fields: 'files(id, name, mimeType, modifiedTime, size)',
      q: "mimeType='application/pdf'",
    });

    res.json({
      success: true,
      data: { files: response.data.files || [] }
    });
  } catch (error) {
    console.error('Google Drive list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.importFromGoogleDrive = async (req, res) => {
  try {
    const { fileId, accessToken } = req.body;

    if (!accessToken || !fileId) {
      return res.status(400).json({ success: false, message: 'File ID and access token required' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const file = await drive.files.get({
      fileId: fileId,
      fields: 'name, size',
    });

    const fileName = `${Date.now()}-${file.data.name}`;
    const uploadDir = path.join(__dirname, '..', 'uploads', 'pdfs');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    const dest = fs.createWriteStream(filePath);

    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    response.data.pipe(dest);

    dest.on('finish', async () => {
      try {
        // Calculate checksum
        const crypto = require('crypto');
        const fileBuffer = fs.readFileSync(filePath);
        const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        const pdf = new PDF({
          userId: req.user._id,
          originalName: file.data.name,
          displayName: file.data.name.replace('.pdf', ''),
          fileName: fileName,
          filePath: `uploads/pdfs/${fileName}`,
          fileSize: file.data.size || fs.statSync(filePath).size,
          mimeType: 'application/pdf',
          checksum: checksum,
          processingStatus: 'completed'
        });

        await pdf.save();

        res.json({
          success: true,
          message: 'PDF imported successfully',
          data: { pdf: pdf.getFullInfo() }
        });
      } catch (error) {
        console.error('Save PDF error:', error);
        // Delete the file if save failed
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        res.status(500).json({ success: false, message: error.message });
      }
    });

    dest.on('error', (error) => {
      console.error('Download error:', error);
      res.status(500).json({ success: false, message: 'Failed to download file from Google Drive' });
    });
  } catch (error) {
    console.error('Google Drive import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.dropboxAuth = async (req, res) => {
  try {
    const dbx = new Dropbox({
      clientId: process.env.DROPBOX_APP_KEY,
    });

    const authUrl = await dbx.auth.getAuthenticationUrl(
      process.env.DROPBOX_REDIRECT_URI,
      null,
      'code',
      'offline',
      null,
      'none',
      false
    );

    res.json({
      success: true,
      data: { authUrl }
    });
  } catch (error) {
    console.error('Dropbox auth error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.dropboxCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Authorization code required' });
    }

    const https = require('https');
    const querystring = require('querystring');

    const postData = querystring.stringify({
      code: code,
      grant_type: 'authorization_code',
      client_id: process.env.DROPBOX_APP_KEY,
      client_secret: process.env.DROPBOX_APP_SECRET,
      redirect_uri: process.env.DROPBOX_REDIRECT_URI
    });

    const options = {
      hostname: 'api.dropboxapi.com',
      path: '/oauth2/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const dropboxRequest = https.request(options, (dropboxRes) => {
      let data = '';

      dropboxRes.on('data', (chunk) => {
        data += chunk;
      });

      dropboxRes.on('end', () => {
        try {
          const parsedData = JSON.parse(data);

          if (dropboxRes.statusCode === 200) {
            res.json({
              success: true,
              data: { 
                accessToken: parsedData.access_token,
                tokenType: parsedData.token_type,
                expiresIn: parsedData.expires_in
              }
            });
          } else {
            console.error('Dropbox token error:', parsedData);
            res.status(500).json({ 
              success: false, 
              message: parsedData.error_description || 'Failed to get access token' 
            });
          }
        } catch (error) {
          console.error('Parse error:', error);
          res.status(500).json({ success: false, message: 'Failed to parse response' });
        }
      });
    });

    dropboxRequest.on('error', (error) => {
      console.error('Request error:', error);
      res.status(500).json({ success: false, message: error.message });
    });

    dropboxRequest.write(postData);
    dropboxRequest.end();

  } catch (error) {
    console.error('Dropbox callback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadToDropbox = async (req, res) => {
  try {
    const { pdfId, accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token required' });
    }

    const dbxAuth = new Dropbox({ accessToken });

    const pdf = await PDF.findOne({ uuid: pdfId, userId: req.user._id });
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    const fullPath = path.join(__dirname, '..', pdf.filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server' });
    }

    const fileContent = fs.readFileSync(fullPath);

    const response = await dbxAuth.filesUpload({
      path: `/${pdf.displayName || pdf.originalName || 'document.pdf'}`,
      contents: fileContent,
      mode: 'add',
      autorename: true,
    });

    res.json({
      success: true,
      message: 'File uploaded to Dropbox',
      data: {
        name: response.result.name,
        id: response.result.id,
        path: response.result.path_display
      }
    });
  } catch (error) {
    console.error('Dropbox upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listDropboxFiles = async (req, res) => {
  try {
    const { accessToken } = req.query;

    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Access token required' });
    }

    const dbxAuth = new Dropbox({ accessToken });

    const response = await dbxAuth.filesListFolder({ path: '' });

    const pdfFiles = response.result.entries.filter(
      file => file.name.toLowerCase().endsWith('.pdf')
    );

    res.json({
      success: true,
      data: { files: pdfFiles }
    });
  } catch (error) {
    console.error('Dropbox list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.importFromDropbox = async (req, res) => {
  try {
    const { path: dropboxPath, accessToken } = req.body;

    if (!accessToken || !dropboxPath) {
      return res.status(400).json({ success: false, message: 'Path and access token required' });
    }

    const dbxAuth = new Dropbox({ accessToken });

    const response = await dbxAuth.filesDownload({ path: dropboxPath });

    const fileName = `${Date.now()}-${response.result.name}`;
    const uploadDir = path.join(__dirname, '..', 'uploads', 'pdfs');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, response.result.fileBinary);

    // Calculate checksum
    const crypto = require('crypto');
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const pdf = new PDF({
      userId: req.user._id,
      originalName: response.result.name,
      displayName: response.result.name.replace('.pdf', ''),
      fileName: fileName,
      filePath: `uploads/pdfs/${fileName}`,
      fileSize: response.result.size,
      mimeType: 'application/pdf',
      checksum: checksum,
      processingStatus: 'completed'
    });

    await pdf.save();

    res.json({
      success: true,
      message: 'PDF imported successfully',
      data: { pdf: pdf.getFullInfo() }
    });
  } catch (error) {
    console.error('Dropbox import error:', error);
    // Delete the file if save failed
    const filePath = path.join(__dirname, '..', 'uploads', 'pdfs', `${Date.now()}-${req.body.path?.split('/').pop()}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ success: false, message: error.message });
  }
};