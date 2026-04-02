const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// AI text summarization
router.post('/summarize', protect, aiController.summarizePDF);

// Extract key phrases
router.post('/key-phrases', protect, aiController.extractKeyPhrases);

// Semantic search
router.post('/semantic-search', protect, aiController.semanticSearch);

// Text analysis
router.post('/analyze', protect, aiController.analyzeText);

module.exports = router;