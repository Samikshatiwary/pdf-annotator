import React, { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { highlightsAPI } from '../../services/api/highlights';
import toast from 'react-hot-toast';

const HighlightShare = ({ highlight, isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = `${window.location.origin}/highlight/${highlight?.uuid}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!email) return;

    try {
      setLoading(true);
      await highlightsAPI.share(highlight.uuid, { email });
      toast.success('Highlight shared successfully');
      setEmail('');
      onClose();
    } catch (error) {
      toast.error('Failed to share highlight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Highlight"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            "{highlight?.highlightedText}"
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share via email
          </label>
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="flex-1"
            />
            <Button onClick={handleShare} loading={loading}>
              Share
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share link
          </label>
          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              icon={copied ? <Check size={16} /> :<Copy size={16} />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default HighlightShare;