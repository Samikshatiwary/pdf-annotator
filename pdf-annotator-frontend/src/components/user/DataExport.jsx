import React, { useState } from 'react';
import { Download, FileText, Database } from 'lucide-react';
import { Button } from '../ui';
import { userAPI } from '../../services/api/user';
import toast from 'react-hot-toast';

const DataExport = () => {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('json');

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await userAPI.exportData(format);

      // JSON comes back as an object; CSV comes back as a Blob.
      const blob =
        format === 'json'
          ? new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          : data instanceof Blob
          ? data
          : new Blob([data], { type: 'text/csv' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pdf-annotator-data-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Database size={20} className="text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Export Your Data</h3>
      </div>

      <p className="text-gray-600 mb-6">
        Download a copy of your PDFs, highlights, and account information
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormat('json')}
              className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                format === 'json'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`mx-auto mb-2 ${format === 'json' ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
              <p className="text-sm font-medium">JSON</p>
            </button>
            
            <button
              onClick={() => setFormat('csv')}
              className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                format === 'csv'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`mx-auto mb-2 ${format === 'csv' ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
              <p className="text-sm font-medium">CSV</p>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">What's included:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All your PDF documents</li>
            <li>• Highlights and annotations</li>
            <li>• Personal notes and tags</li>
            <li>• Account information</li>
          </ul>
        </div>

        <Button
          onClick={handleExport}
          loading={exporting}
          icon={<Download size={16} />}
          className="w-full"
        >
          {exporting ? 'Exporting...' : 'Export Data'}
        </Button>
      </div>
    </div>
  );
};

export default DataExport;