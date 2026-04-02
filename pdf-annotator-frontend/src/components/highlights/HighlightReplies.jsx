import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button, Input } from '../ui';
import { highlightsAPI } from '../../services/api/highlights';
import { formatDateTime, getInitials } from '../../utils/helpers';

const HighlightReplies = ({ highlightUuid, replies }) => {
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddReply = async () => {
    if (!replyText.trim()) return;

    try {
      setLoading(true);
      await highlightsAPI.addReply(highlightUuid, { content: replyText });
      setReplyText('');
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="space-y-3">
        {replies.map((reply) => (
          <div key={reply.id} className="flex gap-2">
            <div className="avatar avatar-sm bg-primary-600">
              {getInitials(reply.user?.name || 'User')}
            </div>
            <div className="flex-1">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-sm font-medium text-gray-900">
                  {reply.user?.name || 'Anonymous'}
                </p>
                <p className="text-sm text-gray-700 mt-1">{reply.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatDateTime(reply.createdAt)}
              </p>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddReply();
              }
            }}
          />
          <Button
            onClick={handleAddReply}
            loading={loading}
            disabled={!replyText.trim()}
            size="sm"
            icon={<Send size={16} />}
          />
        </div>
      </div>
    </div>
  );
};

export default HighlightReplies;