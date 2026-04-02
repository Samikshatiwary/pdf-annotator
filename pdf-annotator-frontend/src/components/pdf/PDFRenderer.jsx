import React from 'react';
import { Document, Page } from 'react-pdf';
import { Loading } from '../ui';

const PDFRenderer = ({ file, pageNumber, scale = 1.0, onLoadSuccess }) => {
  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      loading={<Loading />}
      error={<div className="text-red-600">Failed to load PDF</div>}
    >
      <Page 
        pageNumber={pageNumber} 
        scale={scale}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        className="shadow-lg"
      />
    </Document>
  );
};

export default PDFRenderer;