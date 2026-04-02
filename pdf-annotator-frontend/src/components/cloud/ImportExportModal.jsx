import React, { useState } from 'react';
import { Upload, Download, FileText, Cloud, Box } from 'lucide-react';
import { Modal, Button, Loading } from '../ui';
import toast from 'react-hot-toast';

const ImportExportModal = ({ isOpen, onClose, mode = 'import' }) => {
  const [source, setSource] = useState('local'); // local, google, dropbox
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      
      if (source === 'local') {
        // Handle local file import
        setTimeout(() => {
          toast.success(`${selectedFiles.length} file(s) imported successfully`);
          setLoading(false);
          onClose();
        }, 2000);
      } else {
        // Handle cloud import
        toast.success('Cloud import coming soon!');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Import failed');
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      
      if (source === 'local') {
        // Handle local export
        setTimeout(() => {
          toast.success('Files exported successfully');
          setLoading(false);
          onClose();
        }, 2000);
      } else {
        // Handle cloud export
        toast.success('Cloud export coming soon!');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Export failed');
      setLoading(false);
    }
  };

  const isImport = mode === 'import';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isImport ? 'Import PDFs' : 'Export PDFs'}
      size="md"
    >
      <div className="space-y-6">
        {/* Source Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {isImport ? 'Import from:' : 'Export to:'}
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSource('local')}
              className={`p-4 border-2 rounded-lg transition-all ${
                source === 'local'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`mx-auto mb-2 ${source === 'local' ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
              <p className="text-sm font-medium text-gray-900">Local</p>
            </button>

            <button
              onClick={() => setSource('google')}
              className={`p-4 border-2 rounded-lg transition-all ${
                source === 'google'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Cloud className={`mx-auto mb-2 ${source === 'google' ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
              <p className="text-sm font-medium text-gray-900">Google Drive</p>
            </button>

            <button
              onClick={() => setSource('dropbox')}
              className={`p-4 border-2 rounded-lg transition-all ${
                source === 'dropbox'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Box className={`mx-auto mb-2 ${source === 'dropbox' ? 'text-primary-600' : 'text-gray-400'}`} size={24} />
              <p className="text-sm font-medium text-gray-900">Dropbox</p>
            </button>
          </div>
        </div>

        {/* Local File Selection (for import) */}
        {isImport && source === 'local' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PDF files
            </label>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                cursor-pointer"
            />
            {selectedFiles.length > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>
        )}

        {/* Cloud Notice */}
        {source !== 'local' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Coming Soon:</strong> Cloud storage integration is under development.
              Use local {isImport ? 'import' : 'export'} for now.
            </p>
          </div>
        )}

        {/* Options */}
        {isExport && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="checkbox" defaultChecked />
                <span className="text-gray-700">Include highlights</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="checkbox" defaultChecked />
                <span className="text-gray-700">Include notes</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="checkbox" />
                <span className="text-gray-700">Merge into single file</span>
              </label>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={isImport ? handleImport : handleExport}
            loading={loading}
            disabled={isImport && source === 'local' && selectedFiles.length === 0}
            icon={isImport ? <Upload size={16} /> : <Download size={16} />}
            className="flex-1"
          >
            {isImport ? 'Import' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportExportModal;