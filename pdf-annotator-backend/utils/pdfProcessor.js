const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { logFileOperation, logError, logDebug } = require('./logger');

// PDF metadata dates use the format "D:YYYYMMDDHHmmSS+HH'mm'", which the native
// Date constructor cannot parse (it yields an Invalid Date object that then fails
// Mongoose validation on save). Parse it safely and return null when unparseable.
const parsePdfDate = (raw) => {
  if (!raw) return null;
  if (raw instanceof Date) return isNaN(raw.getTime()) ? null : raw;
  if (typeof raw !== 'string') return null;

  const match = raw.match(
    /D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/
  );
  if (match) {
    const [, year, month = '01', day = '01', hour = '00', min = '00', sec = '00'] = match;
    const d = new Date(Date.UTC(+year, +month - 1, +day, +hour, +min, +sec));
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
};

class PDFProcessor {
  constructor() {
    this.processingQueue = new Map();
  }

  async extractText(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text || '';
    } catch (error) {
      logError(error, { operation: 'Extract text', filePath });
      throw error;
    }
  }

  async processPDF(filePath, options = {}) {
    try {
      logDebug('Starting PDF processing', { filePath });
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer, {
        max: options.maxPages || 0, 
        version: 'v1.10.100'
      });

      
      const metadata = {
        pageCount: pdfData.numpages,
        title: pdfData.info?.Title || null,
        author: pdfData.info?.Author || null,
        subject: pdfData.info?.Subject || null,
        keywords: pdfData.info?.Keywords || null,
        creator: pdfData.info?.Creator || null,
        producer: pdfData.info?.Producer || null,
        creationDate: parsePdfDate(pdfData.info?.CreationDate),
        modificationDate: parsePdfDate(pdfData.info?.ModDate),
        pdfVersion: pdfData.version || null,
        isEncrypted: pdfData.info?.IsEncrypted || false,
        hasForm: pdfData.info?.IsAcroFormPresent || false,
        language: pdfData.info?.Language || null
      };

      const textContent = pdfData.text || '';
      const extractedText = await this.extractTextByPages(dataBuffer, metadata.pageCount);

      const result = {
        metadata,
        textContent: textContent.substring(0, 50000), 
        extractedText,
        processingStatus: 'completed',
        processingError: null
      };

      logFileOperation('processed', path.basename(filePath), {
        pageCount: metadata.pageCount,
        textLength: textContent.length
      });

      return result;

    } catch (error) {
      logError(error, {
        operation: 'PDF processing',
        filePath
      });

      return {
        metadata: { pageCount: 0 },
        textContent: '',
        extractedText: [],
        processingStatus: 'failed',
        processingError: error.message
      };
    }
  }
  async extractTextByPages(dataBuffer, pageCount) {
    try {
      const extractedText = [];
      const pdfData = await pdfParse(dataBuffer);
      const fullText = pdfData.text || '';
      
      if (pageCount > 0 && fullText) {
        
        const textPerPage = Math.ceil(fullText.length / pageCount);
        
        for (let i = 0; i < pageCount; i++) {
          const startIndex = i * textPerPage;
          const endIndex = Math.min((i + 1) * textPerPage, fullText.length);
          const pageText = fullText.substring(startIndex, endIndex);
          
          if (pageText.trim()) {
            extractedText.push({
              page: i + 1,
              content: pageText.trim(),
              boundingBoxes: [] 
            });
          }
        }
      }

      return extractedText;

    } catch (error) {
      logError(error, { operation: 'Page-by-page text extraction' });
      return [];
    }
  }

  
  generateSummary(textContent, maxLength = 500) {
    if (!textContent || textContent.length <= maxLength) {
      return textContent;
    }

    
    const sentences = textContent.split(/[.!?]+/);
    let summary = '';
    
    for (const sentence of sentences) {
      if (summary.length + sentence.length + 1 <= maxLength) {
        summary += sentence.trim() + '. ';
      } else {
        break;
      }
    }

    return summary.trim() || textContent.substring(0, maxLength) + '...';
  }

  
  extractKeywords(textContent, maxKeywords = 20) {
    if (!textContent) return [];

    
    const words = textContent
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); 
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    const keywords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);

    return keywords;
  }

  async validatePDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const header = dataBuffer.slice(0, 5).toString();
      if (header !== '%PDF-') {
        throw new Error('Invalid PDF file format');
      }

      await pdfParse(dataBuffer, { max: 1 }); 

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async isPasswordProtected(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      await pdfParse(dataBuffer, { max: 1 });
      return false;
    } catch (error) {
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        return true;
      }
      throw error; 
    }
  }

  async getPageCount(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer, { max: 1 });
      return pdfData.numpages || 0;
    } catch (error) {
      logError(error, { operation: 'Get page count', filePath });
      return 0;
    }
  }

  async queueProcessing(pdfId, filePath, options = {}) {
    if (this.processingQueue.has(pdfId)) {
      throw new Error('PDF is already being processed');
    }

    this.processingQueue.set(pdfId, {
      status: 'queued',
      startTime: Date.now()
    });

    try {
      
      this.processingQueue.set(pdfId, {
        status: 'processing',
        startTime: Date.now()
      });

      const result = await this.processPDF(filePath, options);

      
      this.processingQueue.delete(pdfId);

      return result;

    } catch (error) {
      
      this.processingQueue.set(pdfId, {
        status: 'failed',
        error: error.message,
        startTime: Date.now()
      });

      throw error;
    }
  }

  getProcessingStatus(pdfId) {
    return this.processingQueue.get(pdfId) || { status: 'not_found' };
  }

  cleanupProcessingQueue() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; 

    for (const [pdfId, info] of this.processingQueue.entries()) {
      if (now - info.startTime > maxAge) {
        this.processingQueue.delete(pdfId);
      }
    }
  }

  
  searchInPDF(textContent, query, options = {}) {
    if (!textContent || !query) return [];

    const {
      caseSensitive = false,
      wholeWord = false,
      maxResults = 50
    } = options;

    let searchText = textContent;
    let searchQuery = query;

    if (!caseSensitive) {
      searchText = textContent.toLowerCase();
      searchQuery = query.toLowerCase();
    }

    const results = [];
    let lastIndex = 0;

    while (results.length < maxResults) {
      let index;

      if (wholeWord) {
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedQuery}\\b`, caseSensitive ? 'g' : 'gi');
        const match = regex.exec(searchText.slice(lastIndex));
        if (!match) break;
        index = lastIndex + match.index;
      } else {
        index = searchText.indexOf(searchQuery, lastIndex);
        if (index === -1) break;
      }

      
      const contextLength = 100;
      const start = Math.max(0, index - contextLength);
      const end = Math.min(textContent.length, index + searchQuery.length + contextLength);
      const context = textContent.substring(start, end);

      results.push({
        index,
        context,
        match: textContent.substring(index, index + searchQuery.length)
      });

      lastIndex = index + searchQuery.length;
    }

    return results;
  }

  
  extractTables(textContent) {
    const lines = textContent.split('\n');
    const tables = [];
    let currentTable = [];
    let inTable = false;

    for (const line of lines) {
      const tabCount = (line.match(/\t/g) || []).length;
      const spaceGroups = (line.match(/\s{2,}/g) || []).length;

      if (tabCount > 1 || spaceGroups > 2) {
        if (!inTable) {
          inTable = true;
          currentTable = [];
        }
        currentTable.push(line.trim());
      } else {
        if (inTable && currentTable.length > 1) {
          tables.push(currentTable);
          currentTable = [];
        }
        inTable = false;
      }
    }
    if (inTable && currentTable.length > 1) {
      tables.push(currentTable);
    }

    return tables;
  }
}
const pdfProcessor = new PDFProcessor();
setInterval(() => {
  pdfProcessor.cleanupProcessingQueue();
}, 10 * 60 * 1000);

module.exports = pdfProcessor;