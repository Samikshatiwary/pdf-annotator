import React, { useState, useEffect } from 'react';
import { Box, Upload, Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button, Modal, Loading } from '../ui';
import { cloudAPI } from '../../services/api/cloud';
import toast from 'react-hot-toast';

const DropboxIntegration = ({ isOpen, onClose, pdfId }) => {
  const [connected, setConnected] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('dropbox_access_token');
    if (token) {
      setAccessToken(token);
      setConnected(true);
    }
  }, [isOpen]);

  const handleConnect = async () => {
    try {
      const response = await cloudAPI.dropboxAuth();
      if (response.success) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      toast.error('Failed to connect to Dropbox');
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('dropbox_access_token');
    setAccessToken(null);
    setConnected(false);
    setShowFiles(false);
    setFiles([]);
    toast.success('Disconnected from Dropbox');
  };

  const handleExport = async () => {
    if (!pdfId) {
      toast.error('No PDF selected');
      return;
    }

    if (!accessToken) {
      toast.error('Please connect to Dropbox first');
      return;
    }

    try {
      setSyncing(true);
      const response = await cloudAPI.uploadToDropbox(pdfId, accessToken);
      if (response.success) {
        toast.success('PDF exported to Dropbox successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to export PDF');
    } finally {
      setSyncing(false);
    }
  };

  const handleLoadFiles = async () => {
    if (!accessToken) {
      toast.error('Please connect to Dropbox first');
      return;
    }

    try {
      setLoadingFiles(true);
      const response = await cloudAPI.listDropboxFiles(accessToken);
      if (response.success) {
        setFiles(response.data.files || []);
        setShowFiles(true);
      }
    } catch (error) {
      toast.error('Failed to load files from Dropbox');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleImport = async (file) => {
    if (!accessToken) {
      toast.error('Please connect to Dropbox first');
      return;
    }

    try {
      setSyncing(true);
      const response = await cloudAPI.importFromDropbox(file.path_display, accessToken);
      if (response.success) {
        toast.success('PDF imported successfully!');
        setShowFiles(false);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import PDF');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dropbox Integration" size="lg">
      <div className="space-y-6">
        <div className={`rounded-lg p-4 flex items-center justify-between ${
          connected ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Box className={connected ? 'text-blue-600' : 'text-gray-400'} size={24} />
            <div>
              <p className="font-medium text-gray-900">
                {connected ? 'Connected to Dropbox' : 'Not Connected'}
              </p>
              <p className="text-sm text-gray-600">
                {connected ? 'Your account is linked' : 'Connect to backup PDFs'}
              </p>
            </div>
          </div>
          {connected ? (
            <CheckCircle className="text-green-600" size={20} />
          ) : (
            <AlertCircle className="text-gray-400" size={20} />
          )}
        </div>

        {!connected ? (
          <div className="text-center py-6">
            <Button onClick={handleConnect} icon={<Box size={16} />}>
              Connect Dropbox
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {syncing || loadingFiles ? (
              <Loading text={syncing ? "Processing..." : "Loading files..."} />
            ) : showFiles ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Your Dropbox PDFs</h4>
                  <Button 
                    onClick={() => setShowFiles(false)} 
                    variant="secondary"
                    size="sm"
                  >
                    Back
                  </Button>
                </div>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {files.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No PDF files found in your Dropbox
                    </p>
                  ) : (
                    files.map((file) => (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText size={20} className="text-red-600 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{file.name}</span>
                        </div>
                        <Button 
                          onClick={() => handleImport(file)}
                          size="sm"
                          icon={<Download size={14} />}
                        >
                          Import
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleExport} 
                  icon={<Upload size={16} />} 
                  className="w-full"
                  disabled={!pdfId}
                >
                  Export Current PDF to Dropbox
                </Button>
                
                <Button 
                  onClick={handleLoadFiles} 
                  icon={<Download size={16} />} 
                  variant="secondary"
                  className="w-full"
                >
                  Import PDF from Dropbox
                </Button>
                
                <Button 
                  onClick={handleDisconnect} 
                  variant="secondary"
                  className="w-full"
                >
                  Disconnect Dropbox
                </Button>
              </>
            )}
          </div>
        )}

        {!pdfId && connected && !showFiles && (
          <p className="text-xs text-gray-500 text-center">
            Open a PDF to export it to Dropbox
          </p>
        )}
      </div>
    </Modal>
  );
};

export default DropboxIntegration;