import React from 'react';
import PDFCard from './PDFCard';
import { Loading } from '../ui';

const LibraryGrid = ({ pdfs, loading, onPdfClick, onDelete, onFavorite }) => {
  if (loading) {
    return <Loading text="Loading PDFs..." />;
  }

  if (!pdfs || pdfs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No PDFs yet</h3>
        <p className="text-gray-500">Upload your first PDF to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pdfs.map((pdf) => (
        <PDFCard
          key={pdf.uuid}
          pdf={pdf}
          onClick={() => onPdfClick(pdf)}
          onDelete={() => onDelete(pdf.uuid)}
          onFavorite={() => onFavorite(pdf.uuid)}
        />
      ))}
    </div>
  );
};

export default LibraryGrid;