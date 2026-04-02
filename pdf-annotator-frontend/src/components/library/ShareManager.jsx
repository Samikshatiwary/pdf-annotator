import React, { useState } from 'react';
import { Share2, Mail, Copy, Check, X } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { useSharing } from '../../hooks/useSharing';
import toast from 'react-hot-toast';

const ShareManager = ({ pdf, isOpen, onClose }) => {
  const { sharePDF, loading } = useSharing();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/pdf/${pdf?.uuid}`;

  const handleShare = async () => {
    if (!email) return;

    const result = await sharePDF(pdf.uuid, { email, permission });
    if (result.success) {
      setEmail('');
      toast.success('PDF shared successfully');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share "${pdf?.displayName}"`}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share with people
          </label>
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              icon={<Mail size={16} />}
              className="flex-1"
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="view">Can view</option>
              <option value="comment">Can comment</option>
              <option value="edit">Can edit</option>
            </select>
          </div>
          <Button
            onClick={handleShare}
            loading={loading}
            disabled={!email}
            className="w-full mt-2"
          >
            Send Invitation
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or share link</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anyone with the link
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
              icon={copied ? <Check size={16} /> : <Copy size={16} />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {pdf?.sharedWith && pdf.sharedWith.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Shared with
            </h4>
            <div className="space-y-2">
              {pdf.sharedWith.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm bg-primary-600">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareManager;