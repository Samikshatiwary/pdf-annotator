import React from 'react';
import { BarChart3, TrendingUp, Users, FileText } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { Loading } from '../components/ui';

const Analytics = () => {
  const { stats, loading } = useDashboard();

  if (loading) {
    return <Loading fullScreen text="Loading analytics..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Track your PDF usage and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <FileText className="text-blue-600" size={24} />
            <span className="text-xs text-green-600 font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.pdfs?.total || 0}</p>
          <p className="text-sm text-gray-600">Total PDFs</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-yellow-600" size={24} />
            <span className="text-xs text-green-600 font-medium">+8%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.highlights?.total || 0}</p>
          <p className="text-sm text-gray-600">Total Highlights</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-green-600" size={24} />
            <span className="text-xs text-green-600 font-medium">+5%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.pdfs?.shared || 0}</p>
          <p className="text-sm text-gray-600">Shared PDFs</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-purple-600" size={24} />
            <span className="text-xs text-green-600 font-medium">+15%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">245</p>
          <p className="text-sm text-gray-600">Active Days</p>
        </div>
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card h-80 flex items-center justify-center">
          <p className="text-gray-500">Usage chart coming soon</p>
        </div>
        <div className="card h-80 flex items-center justify-center">
          <p className="text-gray-500">Activity chart coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;