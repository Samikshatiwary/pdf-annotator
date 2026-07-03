import React, { useState, useEffect } from 'react';
import { Activity, User, FileText, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { Loading } from '../ui';
import { formatDateTime } from '../../utils/helpers';
import { highlightsAPI } from '../../services/api/highlights';

const ActivityFeed = ({ pdfId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pdfId) loadActivities();
  }, [pdfId]);

  // Build a real activity feed for this PDF from its highlights (who added what, when).
  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await highlightsAPI.getByPdfId(pdfId);
      const highlights = response?.data?.highlights || [];

      const items = highlights.map((h) => ({
        id: h.uuid || h._id,
        type: 'highlight',
        user: { name: h.userId?.name || 'A user', avatar: h.userId?.avatar || null },
        action: 'added a highlight',
        page: h.pageNumber,
        content: h.highlightedText,
        timestamp: new Date(h.createdAt),
      }));

      // Most recent first
      items.sort((a, b) => b.timestamp - a.timestamp);
      setActivities(items);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'highlight':
        return <FileText className="text-yellow-600" size={16} />;
      case 'comment':
        return <MessageSquare className="text-blue-600" size={16} />;
      case 'edit':
        return <Edit className="text-green-600" size={16} />;
      case 'delete':
        return <Trash2 className="text-red-600" size={16} />;
      default:
        return <Activity className="text-gray-600" size={16} />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return formatDateTime(timestamp);
  };

  if (loading) {
    return <Loading text="Loading activity..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="text-primary-600" size={20} />
        <h3 className="font-semibold text-gray-900">Recent Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No activity yet
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-white rounded-full border border-gray-200 flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}
                    <span className="text-gray-600">{activity.action}</span>
                    {activity.page && (
                      <span className="text-gray-600"> on page {activity.page}</span>
                    )}
                  </p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {getTimeAgo(activity.timestamp)}
                  </span>
                </div>
                {activity.content && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {activity.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;