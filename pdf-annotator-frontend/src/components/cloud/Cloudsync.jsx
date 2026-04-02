import React, { useState } from 'react';
import { Cloud, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '../ui';
import { formatDateTime } from '../../utils/helpers';

const CloudSync = () => {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSync, setLastSync] = useState(new Date());
  const [syncedItems, setSyncedItems] = useState(0);

  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      
      // Simulate sync process
      setTimeout(() => {
        setSyncStatus('success');
        setLastSync(new Date());
        setSyncedItems(12);
        
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }, 2000);
    } catch (error) {
      setSyncStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="animate-spin text-blue-600" size={20} />;
      case 'success':
        return <CheckCircle2 className="text-green-600" size={20} />;
      case 'error':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return <Cloud className="text-gray-600" size={20} />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing to cloud...';
      case 'success':
        return `${syncedItems} items synced successfully`;
      case 'error':
        return 'Sync failed';
      default:
        return 'Cloud sync available';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'bg-blue-50 border-blue-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()} transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {getStatusText()}
            </p>
            {syncStatus === 'idle' && lastSync && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock size={12} />
                Last synced: {formatDateTime(lastSync)}
              </p>
            )}
          </div>
        </div>

        <Button
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          variant="secondary"
          size="sm"
          icon={syncStatus === 'syncing' ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
        >
          {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {syncStatus === 'error' && (
        <div className="mt-3 p-2 bg-red-100 rounded text-xs text-red-800">
          Failed to sync with cloud storage. Check your connection and try again.
        </div>
      )}
    </div>
  );
};

export default CloudSync;