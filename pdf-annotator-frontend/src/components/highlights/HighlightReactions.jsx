import React from 'react';
import { ThumbsUp, ThumbsDown, Heart, Smile } from 'lucide-react';
import { useReactions } from '../../hooks/useReactions';

// Types must match the backend enum: like | dislike | love | laugh | angry | sad
const reactionTypes = [
  { type: 'like', icon: ThumbsUp, label: 'Like' },
  { type: 'dislike', icon: ThumbsDown, label: 'Dislike' },
  { type: 'love', icon: Heart, label: 'Love' },
  { type: 'laugh', icon: Smile, label: 'Laugh' },
];

const HighlightReactions = ({ highlightUuid, reactions }) => {
  const { addReaction, removeReaction, loading } = useReactions();

  const handleReaction = async (reactionType) => {
    const existingReaction = reactions.find(r => r.type === reactionType);
    
    if (existingReaction) {
      await removeReaction(highlightUuid);
    } else {
      await addReaction(highlightUuid, reactionType);
    }
  };

  const getReactionCount = (type) => {
    return reactions.filter(r => r.type === type).length;
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2">
        {reactionTypes.map(({ type, icon: Icon, label }) => {
          const count = getReactionCount(type);
          const hasReacted = reactions.some(r => r.type === type);

          return (
            <button
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                handleReaction(type);
              }}
              disabled={loading}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors
                ${hasReacted 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title={label}
            >
              <Icon size={14} />
              {count > 0 && <span>{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HighlightReactions;