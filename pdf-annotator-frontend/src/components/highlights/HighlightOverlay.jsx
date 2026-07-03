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
          className="absolute pointer-events-auto cursor-pointer transition-all hover:brightness-95"
          style={{
            left: `${(highlight.position?.x || 0) * scale}px`,
            top: `${(highlight.position?.y || 0) * scale}px`,
            width: `${(highlight.position?.width || 100) * scale}px`,
            height: `${(highlight.position?.height || 20) * scale}px`,
            backgroundColor: highlight.color || '#ffff00',
            opacity: Math.max(highlight.opacity || 0.4, 0.4),
            mixBlendMode: 'multiply',
            borderRadius: '2px',
            pointerEvents: 'auto'
          }}
          title={highlight.highlightedText?.substring(0, 50) + '...'}
        />
      ))}
    </div>
  );
};

export default HighlightOverlay;