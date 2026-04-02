import React, { useEffect, useState } from 'react';
import { Download, Trash2, HardDrive } from 'lucide-react';
import { Button, Modal, Loading } from '../ui';
import { indexedDBService } from '../../services/offline/indexedDB';
import { formatFileSize } from '../../utils/helpers';

const OfflineManager = ({ isOpen, onClose }) => {
  const [offlineData, setOfflineData] = useState({
    pdfs: [],
    highlights: [],
    totalSize: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadOfflineData();
    }
  }, [isOpen]);

  const loadOfflineData = async () => {
    try {
      setLoading(true);
      
      // Load all offline data
      const pdfs = await indexedDBService.db.pdfs.toArray();
      const highlights = await indexedDBService.db.highlights.toArray();
      
      // Calculate total size
      const totalSize = pdfs.reduce((sum, pdf) => sum + (pdf.size || 0), 0);

      setOfflineData({
        pdfs,
        highlights,
        totalSize,
      });
    } catch (error) {
      console.error('Failed to load offline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await indexedDBService.clearAll();
      setOfflineData({
        pdfs: [],
        highlights: [],
        totalSize: 0,
      });
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  };

  const handleRemovePDF = async (uuid) => {
    try {
      await indexedDBService.db.pdfs.delete(uuid);
      // Also remove associated highlights
      await indexedDBService.db.highlights
        .where('pdfId')
        .equals(uuid)
        .delete();
      
      loadOfflineData();
    } catch (error) {
      console.error('Failed to remove PDF:', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Offline Storage"
      size="lg"
    >
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-6">
          {/* Storage Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="text-primary-600" size={20} />
                <h3 className="font-semibold text-gray-900">Storage Usage</h3>
              </div>
              <Button
                onClick={handleClearAll}
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
                disabled={offlineData.pdfs.length === 0}
              >
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {offlineData.pdfs.length}
                </p>
                <p className="text-sm text-gray-600">PDFs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {offlineData.highlights.length}
                </p>
                <p className="text-sm text-gray-600">Highlights</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatFileSize(offlineData.totalSize)}
                </p>
                <p className="text-sm text-gray-600">Total Size</p>
              </div>
            </div>
          </div>

          {/* Offline PDFs List */}
          {offlineData.pdfs.length > 0 ? (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Offline PDFs
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {offlineData.pdfs.map((pdf) => (
                  <div
                    key={pdf.uuid}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Download className="text-primary-600" size={20} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {pdf.displayName || pdf.originalName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(pdf.size || 0)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePDF(pdf.uuid)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No offline data stored</p>
              <p className="text-sm text-gray-400 mt-2">
                Download PDFs to access them offline
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Offline data is stored locally on your device. 
              It will be automatically synced when you're back online.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default OfflineManager;