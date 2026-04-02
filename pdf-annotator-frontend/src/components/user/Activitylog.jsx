import React, { useEffect } from 'react';
import { Activity, FileText, Highlighter, Share2, Download } from 'lucide-react';
import { useActivity } from '../../hooks/useActivity';
import { Loading } from '../ui';
import { formatDateTime } from '../../utils/helpers';

const ActivityLog = () => {
  const { activities, loading } = useActivity();

  const getActivityIcon = (type) => {
    switch (type) {
      case 'upload':
        return <FileText className="text-blue-600" size={20} />;
      case 'highlight':
        return <Highlighter className="text-yellow-600" size={20} />;
      case 'share':
        return <Share2 className="text-green-600" size={20} />;
      case 'download':
        return <Download className="text-purple-600" size={20} />;
      default:
        return <Activity className="text-gray-600" size={20} />;
    }
  };

  if (loading) {
    return <Loading text="Loading activity..." />;
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Log</h3>

      <div className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Activity className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;