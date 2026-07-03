import Dexie from 'dexie';

const db = new Dexie('PDFAnnotatorDB');

db.version(1).stores({
  pdfs: 'uuid, userId, createdAt',
  highlights: 'uuid, pdfId, userId, createdAt',
  cache: 'key, timestamp',
});

// v2 adds an outbox for mutations made while offline, to be replayed on reconnect.
db.version(2).stores({
  pdfs: 'uuid, userId, createdAt',
  highlights: 'uuid, pdfId, userId, createdAt',
  cache: 'key, timestamp',
  outbox: '++id, type, createdAt',
});

export const indexedDBService = {
  db,

  // Save PDF offline
  savePDF: async (pdfData) => {
    return await db.pdfs.put(pdfData);
  },

  // Get PDF offline
  getPDF: async (uuid) => {
    return await db.pdfs.get(uuid);
  },

  // Cache the list of PDFs for offline browsing
  savePDFs: async (pdfs = []) => {
    return await db.pdfs.bulkPut(pdfs.filter((p) => p && p.uuid));
  },

  getAllPDFs: async () => {
    return await db.pdfs.toArray();
  },

  // Save highlights offline
  saveHighlights: async (highlights) => {
    return await db.highlights.bulkPut((highlights || []).filter((h) => h && h.uuid));
  },

  // Get highlights offline
  getHighlights: async (pdfId) => {
    return await db.highlights.where('pdfId').equals(pdfId).toArray();
  },

  // --- Offline outbox (queued mutations) ---
  queueMutation: async (type, payload) => {
    return await db.outbox.add({ type, payload, createdAt: new Date().toISOString() });
  },

  getOutbox: async () => {
    return await db.outbox.orderBy('createdAt').toArray();
  },

  removeOutboxItem: async (id) => {
    return await db.outbox.delete(id);
  },

  outboxCount: async () => {
    return await db.outbox.count();
  },

  // Clear all offline data
  clearAll: async () => {
    await db.pdfs.clear();
    await db.highlights.clear();
    await db.cache.clear();
    await db.outbox.clear();
  },
};

export default db;
