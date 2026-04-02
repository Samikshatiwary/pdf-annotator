import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { Button } from '../ui';
import { usePDF } from '../../hooks/usePDF';
import { validatePDFFile } from '../../utils/pdf';
import { formatFileSize } from '../../utils/helpers';

const PDFUpload = ({ onUploadComplete }) => {
  const { uploadPDF, uploadProgress } = usePDF();
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    if (rejectedFiles.length > 0) {
      setError('Please upload a valid PDF file');
      return;
    }

    const file = acceptedFiles[0];
    const validation = validatePDFFile(file);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadPDF(selectedFile);
    if (result.success) {
      setSelectedFile(null);
      if (onUploadComplete) {
        onUploadComplete(result.data);
      }
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError('');
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 text-gray-400" size={48} />
        {isDragActive ? (
          <p className="text-primary-600 font-medium">Drop the PDF here...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium mb-2">
              Drag & drop a PDF file here, or click to select
            </p>
            <p className="text-sm text-gray-500">Maximum file size: 50MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="text-primary-600" size={24} />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {uploadProgress === 0 && (
            <div className="mt-4 flex gap-2">
              <Button onClick={handleUpload} className="flex-1">
                Upload PDF
              </Button>
              <Button onClick={handleRemove} variant="secondary">
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFUpload;