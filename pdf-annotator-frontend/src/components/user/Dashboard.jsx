import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Highlighter, Users, TrendingUp } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { Loading } from '../ui';
import { formatFileSize, formatDate } from '../../utils/helpers';

const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, loading, refresh } = useDashboard();

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 120000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) {
    return <Loading text="Loading dashboard..." />;
  }

  const recentActivity = stats?.dashboard?.statistics?.recentActivity || {};
  const statsCards = [
    {
      title: 'Total PDFs',
      value: stats?.pdfs?.overview?.totalPDFs || 0,
      icon: FileText,
      color: 'bg-blue-500',
      change: recentActivity.pdfsLast30Days ? `+${recentActivity.pdfsLast30Days} this month` : null,
    },
    {
      title: 'Highlights',
      value: stats?.highlights?.overview?.totalHighlights || 0,
      icon: Highlighter,
      color: 'bg-yellow-500',
      change: recentActivity.highlightsLast30Days ? `+${recentActivity.highlightsLast30Days} this month` : null,
    },
    {
      title: 'Shared PDFs',
      value: stats?.pdfs?.overview?.publicPDFs || 0,
      icon: Users,
      color: 'bg-green-500',
      change: null,
    },
    {
      title: 'Storage Used',
      value: formatFileSize(stats?.dashboard?.statistics?.totalSize || 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                {stat.change && (
                  <p className="text-xs text-green-600 mt-1">{stat.change}</p>
                )}
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="text-white" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent PDFs</h3>
          <div className="space-y-3">
            {(stats?.dashboard?.recentPDFs || []).length > 0 ? (
              stats.dashboard.recentPDFs.map((pdf) => (
                <div 
                  key={pdf.uuid} 
                  onClick={() => navigate(`/pdf/${pdf.uuid}`)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                >
                  <div className="w-10 h-10 bg-gray-200 rounded flex-center">
                    <FileText size={20} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{pdf.displayName}</p>
                    <p className="text-xs text-gray-500">{formatDate(pdf.lastViewedAt || pdf.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No PDFs yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Highlights</h3>
          <div className="space-y-3">
            {(stats?.highlights?.recentHighlights || []).length > 0 ? (
              stats.highlights.recentHighlights.map((highlight) => (
                <div 
                  key={highlight.uuid}
                  onClick={() => highlight.pdfId?.uuid && navigate(`/pdf/${highlight.pdfId.uuid}`)}
                  className="p-3 bg-yellow-50 rounded-lg cursor-pointer"
                >
                  <p className="text-sm text-gray-800 line-clamp-2">
                    {highlight.highlightedText}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Page {highlight.pageNumber} • {formatDate(highlight.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No highlights yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;