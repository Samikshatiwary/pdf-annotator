import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, Trash2, Edit, MoreVertical } from 'lucide-react';
import { Dropdown, DropdownItem } from '../ui';
import { formatDateTime } from '../../utils/helpers';
import { getColorClass } from '../../utils/annotations';
import HighlightReactions from './HighlightReactions';
import HighlightReplies from './HighlightReplies';

const HighlightItem = ({ highlight, onClick, onDelete }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className={`${getColorClass(highlight.color)} rounded p-2 mb-2`}>
            <p className="text-sm text-gray-800 line-clamp-3">
              {highlight.highlightedText}
            </p>
          </div>

          {highlight.note?.content && (
            <div className="bg-gray-50 rounded p-2 mb-2">
              <p className="text-sm text-gray-700">{highlight.note.content}</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Page {highlight.pageNumber}</span>
            <span>{formatDateTime(highlight.createdAt)}</span>
            {highlight.tags && highlight.tags.length > 0 && (
              <div className="flex gap-1">
                {highlight.tags.map((tag, index) => (
                  <span key={index} className="badge badge-primary">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dropdown
          trigger={
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical size={16} className="text-gray-500" />
            </button>
          }
        >
          <DropdownItem icon={<Edit size={16} />}>Edit</DropdownItem>
          <DropdownItem icon={<Trash2 size={16} />} onClick={onDelete}>
            Delete
          </DropdownItem>
        </Dropdown>
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowReactions(!showReactions);
          }}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ThumbsUp size={16} />
          <span>{highlight.reactions?.length || 0}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowReplies(!showReplies);
          }}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-600 transition-colors"
        >
          <MessageSquare size={16} />
          <span>{highlight.replies?.length || 0}</span>
        </button>
      </div>

      {showReactions && (
        <HighlightReactions
          highlightUuid={highlight.uuid}
          reactions={highlight.reactions || []}
        />
      )}

      {showReplies && (
        <HighlightReplies
          highlightUuid={highlight.uuid}
          replies={highlight.replies || []}
        />
      )}
    </div>
  );
};

export default HighlightItem;