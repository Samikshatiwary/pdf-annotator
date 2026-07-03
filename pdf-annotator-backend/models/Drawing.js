const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Stores freehand drawing annotations for a PDF page as a fabric.js canvas JSON.
// One document per (pdfId, userId, pageNumber) — upserted on save.
const DrawingSchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    unique: true,
    index: true
  },
  pdfId: {
    type: String, // PDF uuid
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  pageNumber: {
    type: Number,
    required: true,
    min: 1
  },
  // fabric.js canvas JSON (objects in unscaled/base coordinates)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

DrawingSchema.index({ pdfId: 1, userId: 1, pageNumber: 1 }, { unique: true });

module.exports = mongoose.model('Drawing', DrawingSchema);
