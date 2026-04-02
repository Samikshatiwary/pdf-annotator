import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download,
  RotateCw 
} from 'lucide-react';
import { Button } from '../ui';

const PDFControls = ({ 
  pageNumber, 
  numPages, 
  scale, 
  onPrevPage, 
  onNextPage, 
  onZoomIn, 
  onZoomOut,
  onFullScreen,
  onDownload,
  onRotate
}) => {
  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 p-3">
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onPrevPage}
          disabled={pageNumber <= 1}
          size="sm"
          variant="secondary"
          icon={<ChevronLeft size={16} />}
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={pageNumber}
            min={1}
            max={numPages}
            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
            readOnly
          />
          <span className="text-sm text-gray-600">/ {numPages}</span>
        </div>
        <Button
          onClick={onNextPage}
          disabled={pageNumber >= numPages}
          size="sm"
          variant="secondary"
          icon={<ChevronRight size={16} />}
        />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          size="sm"
          variant="secondary"
          icon={<ZoomOut size={16} />}
        />
        <span className="text-sm text-gray-700 min-w-[60px] text-center font-medium">
          {Math.round(scale * 100)}%
        </span>
        <Button
          onClick={onZoomIn}
          disabled={scale >= 3.0}
          size="sm"
          variant="secondary"
          icon={<ZoomIn size={16} />}
        />
      </div>

      {/* Additional Controls */}
      <div className="flex items-center gap-2">
        {onRotate && (
          <Button
            onClick={onRotate}
            size="sm"
            variant="secondary"
            icon={<RotateCw size={16} />}
          />
        )}
        {onFullScreen && (
          <Button
            onClick={onFullScreen}
            size="sm"
            variant="secondary"
            icon={<Maximize size={16} />}
          />
        )}
        {onDownload && (
          <Button
            onClick={onDownload}
            size="sm"
            variant="secondary"
            icon={<Download size={16} />}
          >
            Download
          </Button>
        )}
      </div>
    </div>
  );
};

export default PDFControls;