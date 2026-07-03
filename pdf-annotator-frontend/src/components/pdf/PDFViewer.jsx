import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { Button, Loading } from '../ui';
import HighlightOverlay from '../highlights/HighlightOverlay';
import DrawingLayer from './DrawingLayer';
import { apiClient } from '../../services/apiclient';
import toast from 'react-hot-toast';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Load the worker at the EXACT version react-pdf's bundled pdf.js uses
// (pdfjs.version), so the API and worker versions can never mismatch — the
// top-level pdfjs-dist is a different version and caused "API version does not
// match Worker version".
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ pdfId, onTextSelect, highlights = [], onHighlightClick, activeTool = 'highlight', drawColor = '#ef4444' }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [fileConfig, setFileConfig] = useState(null);
  const [loadError, setLoadError] = useState(false);

  // Fetch the PDF through the authenticated axios client (Bearer token + refresh)
  // as a Blob, then hand react-pdf a local object URL. react-pdf's own fetch does
  // not reliably send the Authorization header, which caused "Failed to load PDF".
  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    if (!pdfId) return;

    setLoading(true);
    setLoadError(false);
    setFileConfig(null);

    // Relative path -> uses apiClient's baseURL (same as every other working call),
    // avoiding any dependency on VITE_BACKEND_URL being loaded.
    apiClient
      .get(`/pdf/${pdfId}/file`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        objectUrl = window.URL.createObjectURL(res.data);
        setFileConfig(objectUrl);
      })
      .catch((err) => {
        console.error('Failed to fetch PDF:', err);
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [pdfId]);

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

  // Calculate position RELATIVE to the PDF page, then normalize to scale=1 so the
  // highlight is stored zoom-independently and renders correctly at any zoom level.
  const x = (rect.left - pageRect.left) / scale;
  const y = (rect.top - pageRect.top) / scale;
  const width = rect.width / scale;
  const height = rect.height / scale;

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
            onClick={async () => {
              try {
                const res = await apiClient.get(`/pdf/${pdfId}/file`, { responseType: 'blob' });
                const url = window.URL.createObjectURL(res.data);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'document.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch (err) {
                toast.error('Failed to download PDF');
              }
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
        {loading && !loadError && <Loading text="Loading PDF..." />}

        {loadError && (
          <div className="text-center py-12 text-red-600">
            Failed to load PDF. Please try again.
          </div>
        )}

        {fileConfig && !loadError && (
          <div className="flex justify-center">
            <div className="relative">
              <Document
                file={fileConfig}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => {
                  console.error('react-pdf load error:', err);
                  setLoadError(true);
                  setLoading(false);
                }}
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

              {/* Freehand drawing / eraser layer */}
              <DrawingLayer
                pdfId={pdfId}
                pageNumber={pageNumber}
                scale={scale}
                activeTool={activeTool}
                color={drawColor}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;