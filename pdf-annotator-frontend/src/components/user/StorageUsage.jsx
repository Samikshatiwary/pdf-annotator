import React from 'react';
import { HardDrive, File, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { formatFileSize } from '../../utils/helpers';

const StorageUsage = ({ storage }) => {
  const storageData = storage || {
    used: 1200000000, // 1.2GB
    total: 5000000000, // 5GB
    breakdown: {
      pdfs: 800000000,
      highlights: 100000000,
      cache: 300000000,
    },
  };

  const usagePercentage = (storageData.used / storageData.total) * 100;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <HardDrive size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
        </div>
        <Button variant="secondary" size="sm" icon={<Trash2 size={16} />}>
          Clear Cache
        </Button>
      </div>

      {/* Usage Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            {formatFileSize(storageData.used)} of {formatFileSize(storageData.total)} used
          </span>
          <span className="text-sm font-medium text-gray-900">
            {usagePercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              usagePercentage > 90 ? 'bg-red-600' : usagePercentage > 70 ? 'bg-yellow-600' : 'bg-primary-600'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Storage Breakdown</h4>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <File className="text-blue-600" size={18} />
              <span className="text-sm text-gray-700">PDF Files</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatFileSize(storageData.breakdown.pdfs)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <File className="text-yellow-600" size={18} />
              <span className="text-sm text-gray-700">Highlights & Notes</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatFileSize(storageData.breakdown.highlights)}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <File className="text-gray-600" size={18} />
              <span className="text-sm text-gray-700">Cache</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatFileSize(storageData.breakdown.cache)}
            </span>
          </div>
        </div>
      </div>

      {usagePercentage > 80 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            You're running low on storage. Consider deleting unused files or upgrading your plan.
          </p>
        </div>
      )}
    </div>
  );
};

export default StorageUsage;