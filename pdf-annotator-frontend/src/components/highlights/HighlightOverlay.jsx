import React from 'react';

const HighlightOverlay = ({ highlights, pageNumber, scale, onHighlightClick }) => {
  if (!highlights || highlights.length === 0) return null;
  
  const pageHighlights = highlights.filter(h => h.pageNumber === pageNumber);

  if (pageHighlights.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {pageHighlights.map((highlight) => (
        <div
          key={highlight.uuid || highlight._id}
          onClick={() => onHighlightClick && onHighlightClick(highlight)}
          className="absolute pointer-events-auto cursor-pointer transition-opacity hover:opacity-70"
          style={{
            left: `${(highlight.position?.x || 0)}px`,
            top: `${(highlight.position?.y || 0)}px`,
            width: `${(highlight.position?.width || 100)}px`,
            height: `${(highlight.position?.height || 20)}px`,
            backgroundColor: highlight.color || '#ffff00',
            opacity: highlight.opacity || 0.3,
            mixBlendMode: 'multiply',
            pointerEvents: 'auto'
          }}
          title={highlight.highlightedText?.substring(0, 50) + '...'}
        />
      ))}
    </div>
  );
};

export default HighlightOverlay;