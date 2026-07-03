const path = require('path');
const fs = require('fs');
const PDF = require('../models/PDF');
const pdfProcessor = require('../utils/pdfProcessor');
const natural = require('natural');
const compromise = require('compromise');

// Summarize PDF
exports.summarizePDF = async (req, res) => {
  try {
    const { pdfId, maxLength = 200 } = req.body;

    const pdf = await PDF.findOne({ uuid: pdfId, userId: req.user._id });
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    // Build correct file path
    const filePath = path.join(__dirname, '..', pdf.filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server' });
    }

    // Extract text from PDF
    const text = await pdfProcessor.extractText(filePath);
    if (!text || text.length === 0) {
      return res.status(400).json({ success: false, message: 'Could not extract text from PDF' });
    }

    // Simple extractive summary
    const summary = extractiveSummary(text, maxLength);

    res.json({
      success: true,
      data: { summary, originalLength: text.length }
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Extract key phrases
exports.extractKeyPhrases = async (req, res) => {
  try {
    const { pdfId, limit = 10 } = req.body;

    const pdf = await PDF.findOne({ uuid: pdfId, userId: req.user._id });
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    const filePath = path.join(__dirname, '..', pdf.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server' });
    }

    const text = await pdfProcessor.extractText(filePath);
    if (!text || text.length === 0) {
      return res.status(400).json({ success: false, message: 'Could not extract text from PDF' });
    }

    const keyPhrases = extractKeyPhrasesFromText(text, limit);

    res.json({
      success: true,
      data: { keyPhrases }
    });
  } catch (error) {
    console.error('Key phrases error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Semantic search
exports.semanticSearch = async (req, res) => {
  try {
    const { query, pdfId } = req.body;

    const pdf = await PDF.findOne({ uuid: pdfId, userId: req.user._id });
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    const filePath = path.join(__dirname, '..', pdf.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server' });
    }

    const text = await pdfProcessor.extractText(filePath);
    if (!text || text.length === 0) {
      return res.status(400).json({ success: false, message: 'Could not extract text from PDF' });
    }

    const results = semanticSearchInText(query, text);

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Text analysis
exports.analyzeText = async (req, res) => {
  try {
    const { pdfId } = req.body;

    const pdf = await PDF.findOne({ uuid: pdfId, userId: req.user._id });
    if (!pdf) {
      return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    const filePath = path.join(__dirname, '..', pdf.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF file not found on server' });
    }

    const text = await pdfProcessor.extractText(filePath);
    if (!text || text.length === 0) {
      return res.status(400).json({ success: false, message: 'Could not extract text from PDF' });
    }

    const analysis = analyzeTextContent(text);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions (unchanged)
function extractiveSummary(text, maxLength) {
  try {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [];
    if (sentences.length === 0) {
      return text.substring(0, maxLength);
    }

    const wordFreq = {};
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleaned = word.replace(/[^\w]/g, '');
      if (cleaned.length > 3) {
        wordFreq[cleaned] = (wordFreq[cleaned] || 0) + 1;
      }
    });

    const sentenceScores = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      const score = words.reduce((sum, word) => {
        const cleaned = word.replace(/[^\w]/g, '');
        return sum + (wordFreq[cleaned] || 0);
      }, 0);
      return { sentence: sentence.trim(), score: score / words.length };
    });

    sentenceScores.sort((a, b) => b.score - a.score);
    
    let summary = '';
    for (const item of sentenceScores) {
      if (summary.length + item.sentence.length <= maxLength) {
        summary += item.sentence + ' ';
      } else {
        break;
      }
    }

    return summary.trim() || text.substring(0, maxLength);
  } catch (error) {
    console.error('Summary extraction error:', error);
    return text.substring(0, maxLength);
  }
}

function extractKeyPhrasesFromText(text, limit) {
  try {
    const doc = compromise(text);
    
    const nouns = doc.nouns().out('array');
    const topics = doc.topics().out('array');
    
    const phrases = [...nouns, ...topics];
    const frequency = {};
    
    phrases.forEach(phrase => {
      const normalized = phrase.toLowerCase().trim();
      if (normalized.length > 2) {
        frequency[normalized] = (frequency[normalized] || 0) + 1;
      }
    });

    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([phrase, count]) => ({
        phrase,
        count,
        importance: Math.min(count / 10, 1)
      }));

    return sorted;
  } catch (error) {
    console.error('Key phrases extraction error:', error);
    return [];
  }
}

function semanticSearchInText(query, text) {
  try {
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    
    const chunkSize = 500;
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    
    chunks.forEach(chunk => tfidf.addDocument(chunk));
    
    const results = [];
    tfidf.tfidfs(query, (i, measure) => {
      if (measure > 0) {
        results.push({
          text: chunks[i],
          relevance: measure,
          index: i
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
  } catch (error) {
    console.error('Semantic search error:', error);
    return [];
  }
}

function analyzeTextContent(text) {
  try {
    const doc = compromise(text);
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = (text.match(/[.!?]+/g) || []).length || 1;
    
    return {
      wordCount: words.length,
      sentenceCount: sentences,
      readabilityScore: calculateReadability(text, words.length, sentences),
      sentiment: analyzeSentiment(text),
      topics: doc.topics().out('array').slice(0, 5),
    };
  } catch (error) {
    console.error('Text analysis error:', error);
    return {
      wordCount: 0,
      sentenceCount: 0,
      readabilityScore: 0,
      sentiment: 'Neutral',
      topics: []
    };
  }
}

function calculateReadability(text, wordCount, sentenceCount) {
  try {
    if (sentenceCount === 0 || wordCount === 0) return 0;
    
    const syllables = wordCount * 1.5;
    const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
    return Math.max(0, Math.min(100, Math.round(score)));
  } catch (error) {
    return 50;
  }
}

function analyzeSentiment(text) {
  try {
    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const analyzer = new Analyzer('English', stemmer, 'afinn');
    
    const words = text.toLowerCase().split(/\s+/);
    const score = analyzer.getSentiment(words);
    
    if (score > 0.05) return 'Positive';
    if (score < -0.05) return 'Negative';
    return 'Neutral';
  } catch (error) {
    return 'Neutral';
  }
}