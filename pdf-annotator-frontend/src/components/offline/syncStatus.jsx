import React, { useState, useEffect } from 'react';
import { RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import { Button } from '../ui';
import { syncManager } from '../../services/offline/syncManager';

const SyncStatus = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingItems, setPendingItems] = useState(0);

  useEffect(() => {
    checkPendingItems();
  }, []);

  const checkPendingItems = async () => {
    // Check for pending sync items
    // This would query IndexedDB for unsync'd data
    setPendingItems(0);
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncStatus('syncing');

      const [pdfResult, highlightResult] = await Promise.all([
        syncManager.syncPDFs(),
        syncManager.syncHighlights(),
      ]);

      if (pdfResult.success && highlightResult.success) {
        setSyncStatus('success');
        setLastSyncTime(new Date());
        setPendingItems(0);
        
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="animate-spin" size={16} />;
      case 'success':
        return <Check size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <RefreshCw size={16} />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return 'Sync failed';
      default:
        return 'Sync now';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (pendingItems === 0 && syncStatus === 'idle') return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {getStatusText()}
            </p>
            {pendingItems > 0 && (
              <p className="text-xs text-gray-500">
                {pendingItems} item{pendingItems > 1 ? 's' : ''} pending
              </p>
            )}
            {lastSyncTime && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                Last synced: {lastSyncTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {syncStatus !== 'syncing' && (
          <Button
            onClick={handleSync}
            size="sm"
            variant="secondary"
            disabled={pendingItems === 0}
          >
            Sync
          </Button>
        )}
      </div>

      {syncStatus === 'error' && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
          Failed to sync. Please check your connection and try again.
        </div>
      )}
    </div>
  );
};

export default SyncStatus;