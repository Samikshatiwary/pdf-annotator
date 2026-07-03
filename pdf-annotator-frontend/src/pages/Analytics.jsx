import React from 'react';
import { BarChart3, Users, FileText, HardDrive } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { Loading } from '../components/ui';
import { formatFileSize } from '../utils/helpers';

const Analytics = () => {
  const { stats, loading } = useDashboard();

  if (loading) {
    return <Loading fullScreen text="Loading analytics..." />;
  }

  const pdfOverview = stats?.pdfs?.overview || {};
  const highlightOverview = stats?.highlights?.overview || {};
  const highlightsByType = highlightOverview.highlightsByType || [];
  const popularCategories = stats?.pdfs?.insights?.popularCategories || [];

  const cards = [
    { icon: FileText, color: 'text-blue-600', value: pdfOverview.totalPDFs || 0, label: 'Total PDFs' },
    { icon: BarChart3, color: 'text-yellow-600', value: highlightOverview.totalHighlights || 0, label: 'Total Highlights' },
    { icon: Users, color: 'text-green-600', value: pdfOverview.publicPDFs || 0, label: 'Shared PDFs' },
    { icon: HardDrive, color: 'text-purple-600', value: formatFileSize(pdfOverview.totalSize || 0), label: 'Storage Used' },
  ];

  const maxTypeCount = Math.max(1, ...highlightsByType.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your PDF usage and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between mb-4">
              <card.icon className={card.color} size={24} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-600">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highlights by type */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Highlights by Type</h3>
          {highlightsByType.length > 0 ? (
            <div className="space-y-3">
              {highlightsByType.map((item) => (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{item.type}</span>
                    <span className="text-gray-500">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(item.count / maxTypeCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No highlights yet</p>
          )}
        </div>

        {/* Top categories */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Top Categories</h3>
          {popularCategories.length > 0 ? (
            <div className="space-y-3">
              {popularCategories.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700 capitalize">{item.category}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No categories yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
