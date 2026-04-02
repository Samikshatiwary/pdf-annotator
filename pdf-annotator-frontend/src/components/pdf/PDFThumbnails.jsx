import React from 'react';
import { Document, Page } from 'react-pdf';

const PDFThumbnails = ({ file, numPages, currentPage, onPageClick }) => {
  return (
    <div className="bg-gray-100 p-4 overflow-y-auto h-full">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Pages</h3>
      <div className="space-y-3">
        {Array.from({ length: numPages }, (_, index) => index + 1).map((pageNum) => (
          <div
            key={pageNum}
            onClick={() => onPageClick(pageNum)}
            className={`cursor-pointer border-2 rounded transition-all ${
              currentPage === pageNum
                ? 'border-primary-500 shadow-md'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <Document file={file}>
              <Page
                pageNumber={pageNum}
                width={120}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
            <p className="text-center text-xs text-gray-600 py-1">
              Page {pageNum}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFThumbnails;