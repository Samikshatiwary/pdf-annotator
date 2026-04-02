import React, { useState, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button, Loading } from '../ui';
import HighlightOverlay from '../highlights/HighlightOverlay';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.3.93/pdf.worker.mjs`;

const PDFViewer = ({ pdfUrl, onTextSelect, highlights = [], onHighlightClick }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const fileConfig = useMemo(() => ({
    url: pdfUrl,
    httpHeaders: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    withCredentials: true
  }), [pdfUrl]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  const handleTextSelection = () => {
  const selection = window.getSelection();
  if (!selection || !selection.toString().trim()) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Get the PDF page element
  const pageElement = document.querySelector('.react-pdf__Page');
  if (!pageElement) return;
  
  const pageRect = pageElement.getBoundingClientRect();
  
  // Calculate position RELATIVE to PDF page, not viewport
  const x = rect.left - pageRect.left;
  const y = rect.top - pageRect.top;
  const width = rect.width;
  const height = rect.height;
  
  if (onTextSelect) {
    onTextSelect({
      text: selection.toString(),
      pageNumber,
      x: x,
      y: y,
      width: width,
      height: height,
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
  
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            size="sm"
            variant="secondary"
            icon={<ChevronLeft size={16} />}
          />
          <span className="text-sm text-gray-700">
            Page {pageNumber} of {numPages || '--'}
          </span>
          <Button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            size="sm"
            variant="secondary"
            icon={<ChevronRight size={16} />}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            size="sm"
            variant="secondary"
            icon={<ZoomOut size={16} />}
          />
          <span className="text-sm text-gray-700 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            size="sm"
            variant="secondary"
            icon={<ZoomIn size={16} />}
          />
          <Button
            onClick={() => {
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = 'document.pdf';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            }}
            size="sm"
            variant="secondary"
            icon={<Download size={16} />}
          >
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4" onMouseUp={handleTextSelection}>
        {loading && <Loading text="Loading PDF..." />}
        
        <div className="flex justify-center">
          <div className="relative">
            <Document
              file={fileConfig}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loading />}
              error={<div className="text-red-600">Failed to load PDF</div>}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
            
            {/* Render highlights overlay */}
            <HighlightOverlay
              highlights={highlights}
              pageNumber={pageNumber}
              scale={scale}
              onHighlightClick={onHighlightClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;