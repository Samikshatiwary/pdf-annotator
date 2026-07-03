const express = require('express');
const router = express.Router();
const Drawing = require('../models/Drawing');
const PDF = require('../models/PDF');
const { protect } = require('../middleware/auth');

// Verify the user can access the PDF (owner or shared).
const assertPdfAccess = async (pdfId, userId) => {
  const pdf = await PDF.findOne({ uuid: pdfId });
  if (!pdf) return { ok: false, status: 404, message: 'PDF not found' };
  if (!pdf.hasAccess(userId, 'read')) {
    return { ok: false, status: 403, message: 'Access denied' };
  }
  return { ok: true };
};

// Save (upsert) the drawing canvas for a PDF page
router.post('/', protect, async (req, res, next) => {
  try {
    const { pdfId, pageNumber, data } = req.body;

    if (!pdfId || !pageNumber) {
      return res.status(400).json({ success: false, message: 'pdfId and pageNumber are required' });
    }

    const access = await assertPdfAccess(pdfId, req.user._id);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const drawing = await Drawing.findOneAndUpdate(
      { pdfId, userId: req.user._id, pageNumber },
      { $set: { data } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: { drawing } });
  } catch (error) {
    next(error);
  }
});

// Get all drawings for a PDF (current user)
router.get('/pdf/:pdfId', protect, async (req, res, next) => {
  try {
    const { pdfId } = req.params;

    const access = await assertPdfAccess(pdfId, req.user._id);
    if (!access.ok) {
      return res.status(access.status).json({ success: false, message: access.message });
    }

    const drawings = await Drawing.find({ pdfId, userId: req.user._id });
    res.status(200).json({ success: true, data: { drawings } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
