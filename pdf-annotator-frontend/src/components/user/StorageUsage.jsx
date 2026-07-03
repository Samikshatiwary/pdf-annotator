import React, { useState, useEffect } from 'react';
import { HardDrive, File } from 'lucide-react';
import { Loading } from '../ui';
import { userAPI } from '../../services/api/user';
import { formatFileSize } from '../../utils/helpers';

const StorageUsage = () => {
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await userAPI.getStorage();
        if (res.success) setStorage(res.data);
      } catch (err) {
        console.error('Failed to load storage:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading text="Loading storage..." />;

  const overview = storage?.overview || { totalSize: 0, totalFiles: 0, averageFileSize: 0 };
  const categories = storage?.categoryBreakdown || [];

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-6">
        <HardDrive size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Storage Usage</h3>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Used</p>
          <p className="text-2xl font-bold text-gray-900">{formatFileSize(overview.totalSize)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Files</p>
          <p className="text-2xl font-bold text-gray-900">{overview.totalFiles}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Avg. File Size</p>
          <p className="text-2xl font-bold text-gray-900">{formatFileSize(overview.averageFileSize || 0)}</p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">By Category</h4>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">No files yet</p>
        ) : (
          categories.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <File className="text-blue-600" size={16} />
                  <span className="text-sm text-gray-700 capitalize">{cat.category}</span>
                  <span className="text-xs text-gray-400">({cat.count})</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{formatFileSize(cat.size)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full"
                  style={{ width: `${Math.min(cat.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StorageUsage;
