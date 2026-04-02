// Background sync worker for offline data synchronization
let syncQueue = [];
let isSyncing = false;

self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'QUEUE_SYNC':
      queueSync(data);
      break;

    case 'START_SYNC':
      await startSync();
      break;

    case 'GET_QUEUE':
      self.postMessage({ type: 'QUEUE_STATUS', data: syncQueue });
      break;

    case 'CLEAR_QUEUE':
      syncQueue = [];
      self.postMessage({ type: 'QUEUE_CLEARED' });
      break;

    default:
      self.postMessage({ type: 'ERROR', error: 'Unknown sync task' });
  }
});

function queueSync(syncData) {
  syncQueue.push({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...syncData,
  });
  self.postMessage({ type: 'QUEUED', count: syncQueue.length });
}

async function startSync() {
  if (isSyncing || syncQueue.length === 0) {
    return;
  }

  isSyncing = true;
  self.postMessage({ type: 'SYNC_STARTED', count: syncQueue.length });

  try {
    for (let i = 0; i < syncQueue.length; i++) {
      const item = syncQueue[i];
      
      // Simulate sync operation
      await syncItem(item);
      
      self.postMessage({ 
        type: 'SYNC_PROGRESS', 
        progress: ((i + 1) / syncQueue.length) * 100,
        current: i + 1,
        total: syncQueue.length
      });
    }

    syncQueue = [];
    self.postMessage({ type: 'SYNC_COMPLETED' });
  } catch (error) {
    self.postMessage({ type: 'SYNC_ERROR', error: error.message });
  } finally {
    isSyncing = false;
  }
}

async function syncItem(item) {
  // Placeholder for actual sync logic
  return new Promise(resolve => setTimeout(resolve, 100));
}

// Listen for periodic sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pdfs') {
    event.waitUntil(startSync());
  }
});