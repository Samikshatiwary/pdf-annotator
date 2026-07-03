import { syncManager } from '../../services/offline/syncManager';
import toast from 'react-hot-toast';

export const syncMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Auto-replay queued offline mutations when the connection returns.
  if (action.type === 'offline/setOnlineStatus' && action.payload === true) {
    syncManager.pendingCount().then((count) => {
      if (count > 0) {
        toast.loading(`Syncing ${count} offline change(s)...`, { id: 'offline-sync' });
        syncManager.processOutbox().then((res) => {
          if (res.success && res.synced > 0) {
            toast.success(`Synced ${res.synced} offline change(s)`, { id: 'offline-sync' });
          } else {
            toast.dismiss('offline-sync');
          }
        });
      }
    });
  }

  return result;
};
