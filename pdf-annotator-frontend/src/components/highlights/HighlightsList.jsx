import React from 'react';
import { Loading } from '../ui';
import HighlightItem from './HighlightItem';

const HighlightsList = ({ highlights, loading, onHighlightClick, onDelete }) => {
  if (loading) {
    return <Loading text="Loading highlights..." />;
  }

  if (!highlights || highlights.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No highlights yet</p>
        <p className="text-sm text-gray-400 mt-2">
          Select text in the PDF to create your first highlight
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          Highlights ({highlights.length})
        </h3>
      </div>

      <div className="space-y-3">
        {highlights.map((highlight) => (
          <HighlightItem
            key={highlight.uuid}
            highlight={highlight}
            onClick={() => onHighlightClick(highlight)}
            onDelete={() => onDelete(highlight.uuid)}
          />
        ))}
      </div>
    </div>
  );
};

export default HighlightsList;