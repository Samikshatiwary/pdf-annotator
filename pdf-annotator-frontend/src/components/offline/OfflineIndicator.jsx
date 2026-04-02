import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

const OfflineIndicator = () => {
  const { isOnline, isOffline } = useOffline();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="flex-shrink-0">
          <WifiOff className="text-yellow-600" size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-yellow-800">
            You're offline
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Changes will be synced when you're back online
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;