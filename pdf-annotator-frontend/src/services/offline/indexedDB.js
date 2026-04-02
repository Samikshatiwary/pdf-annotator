import Dexie from 'dexie';

const db = new Dexie('PDFAnnotatorDB');

db.version(1).stores({
  pdfs: 'uuid, userId, createdAt',
  highlights: 'uuid, pdfId, userId, createdAt',
  cache: 'key, timestamp',
});

export const indexedDBService = {
  // Save PDF offline
  savePDF: async (pdfData) => {
    return await db.pdfs.put(pdfData);
  },

  // Get PDF offline
  getPDF: async (uuid) => {
    return await db.pdfs.get(uuid);
  },

  // Save highlights offline
  saveHighlights: async (highlights) => {
    return await db.highlights.bulkPut(highlights);
  },

  // Get highlights offline
  getHighlights: async (pdfId) => {
    return await db.highlights.where('pdfId').equals(pdfId).toArray();
  },

  // Clear all offline data
  clearAll: async () => {
    await db.pdfs.clear();
    await db.highlights.clear();
    await db.cache.clear();
  },
};

export default db;