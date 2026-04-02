import React, { useState } from 'react';
import { Cloud, Upload, Download, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Modal, Loading } from '../ui';
import { cloudAPI } from '../../services/api/cloud';
import toast from 'react-hot-toast';

const GoogleDriveIntegration = ({ isOpen, onClose, pdfId }) => {
  const [connected, setConnected] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const handleConnect = async () => {
    try {
      const response = await cloudAPI.googleDriveAuth();
      if (response.success) {
        const authUrl = response.data.authUrl;
        
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          authUrl,
          'Google Drive Auth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        const handleMessage = async (event) => {
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            const code = event.data.code;
            
            try {
              const tokenResponse = await cloudAPI.googleDriveCallback(code);
              if (tokenResponse.success) {
                setAccessToken(tokenResponse.data.accessToken);
                setConnected(true);
                toast.success('Connected to Google Drive!');
                
                // Load files after connecting
                loadFiles(tokenResponse.data.accessToken);
              }
            } catch (error) {
              toast.error('Failed to complete authentication');
            }
            
            window.removeEventListener('message', handleMessage);
            if (popup && !popup.closed) {
              try {
                popup.close();
              } catch (e) {
                console.log('Could not close popup');
              }
            }
          }
        };

        window.addEventListener('message', handleMessage);
      }
    } catch (error) {
      toast.error('Failed to connect to Google Drive');
    }
  };

  const loadFiles = async (token) => {
    try {
      setLoadingFiles(true);
      const response = await cloudAPI.listGoogleDriveFiles(token || accessToken);
      if (response.success) {
        setFiles(response.data.files || []);
      }
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleExport = async () => {
    if (!pdfId) {
      toast.error('No PDF selected');
      return;
    }

    if (!accessToken) {
      toast.error('Please connect to Google Drive first');
      return;
    }

    try {
      setSyncing(true);
      const response = await cloudAPI.uploadToGoogleDrive(pdfId, accessToken);
      if (response.success) {
        toast.success('PDF exported successfully');
        loadFiles();
      }
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async (fileId) => {
    if (!accessToken) {
      toast.error('Please connect to Google Drive first');
      return;
    }

    try {
      setSyncing(true);
      const response = await cloudAPI.importFromGoogleDrive(fileId, accessToken);
      if (response.success) {
        toast.success('PDF imported successfully');
        onClose();
      }
    } catch (error) {
      toast.error('Failed to import PDF');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Drive Integration" size="lg">
      <div className="space-y-6">
        <div className={`rounded-lg p-4 flex items-center justify-between ${
          connected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Cloud className={connected ? 'text-green-600' : 'text-gray-400'} size={24} />
            <div>
              <p className="font-medium text-gray-900">
                {connected ? 'Connected to Google Drive' : 'Not Connected'}
              </p>
              <p className="text-sm text-gray-600">
                {connected ? 'Your account is linked' : 'Connect to backup and import PDFs'}
              </p>
            </div>
          </div>
          {connected ? <CheckCircle className="text-green-600" size={20} /> : <AlertCircle className="text-gray-400" size={20} />}
        </div>

        {!connected ? (
          <div className="text-center py-6">
            <Button onClick={handleConnect} icon={<Cloud size={16} />}>
              Connect Google Drive
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {syncing || loadingFiles ? (
              <Loading text={syncing ? "Syncing..." : "Loading files..."} />
            ) : (
              <>
                <div className="flex gap-2">
                  <Button onClick={handleExport} icon={<Upload size={16} />} className="flex-1" disabled={!pdfId}>
                    Export Current PDF
                  </Button>
                  <Button onClick={() => loadFiles()} variant="secondary" icon={<RefreshCw size={16} />}>
                    Refresh
                  </Button>
                </div>

                {files.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Your PDF Files</h4>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {files.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{new Date(file.modifiedTime).toLocaleDateString()}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            icon={<Download size={14} />}
                            onClick={() => handleImport(file.id)}
                          >
                            Import
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {files.length === 0 && !loadingFiles && (
                  <p className="text-center text-gray-500 py-4">No PDF files found in your Google Drive</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GoogleDriveIntegration;