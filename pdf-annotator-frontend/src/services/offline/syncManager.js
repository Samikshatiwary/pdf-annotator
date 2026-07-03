import { indexedDBService } from './indexedDB';
import { highlightsAPI } from '../api/highlights';

// Replays mutations that were queued while the user was offline, in order.
// Currently supports highlight creation (the main offline write path).
export const syncManager = {
  processOutbox: async () => {
    let synced = 0;
    let failed = 0;

    try {
      const items = await indexedDBService.getOutbox();

      for (const item of items) {
        try {
          if (item.type === 'CREATE_HIGHLIGHT') {
            await highlightsAPI.create(item.payload);
          }
          // Successful (or unknown/obsolete) items are removed from the queue.
          await indexedDBService.removeOutboxItem(item.id);
          synced += 1;
        } catch (err) {
          // Leave the item in the outbox to retry on the next reconnect.
          console.error('Outbox replay failed for item', item.id, err);
          failed += 1;
        }
      }

      return { success: true, synced, failed };
    } catch (error) {
      console.error('Outbox processing failed:', error);
      return { success: false, error };
    }
  },

  pendingCount: async () => {
    try {
      return await indexedDBService.outboxCount();
    } catch {
      return 0;
    }
  },
};
