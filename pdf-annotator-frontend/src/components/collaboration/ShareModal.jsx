import React, { useState } from 'react';
import { Share2, Mail, Link, Users, Check, Copy } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { useSharing } from '../../hooks/useSharing';
import toast from 'react-hot-toast';

const ShareModal = ({ isOpen, onClose, pdf }) => {
  const { sharePDF, loading } = useSharing();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [message, setMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const shareUrl = `${window.location.origin}/shared/pdf/${pdf?.uuid}`;

  const handleShare = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    const result = await sharePDF(pdf.uuid, {
      email,
      permission,
      message,
    });

    if (result.success) {
      setEmail('');
      setMessage('');
      toast.success('PDF shared successfully');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share PDF"
      size="lg"
    >
      <div className="space-y-6">
        {/* PDF Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-1">
            {pdf?.displayName || pdf?.originalName}
          </h4>
          <p className="text-sm text-gray-600">
            Share this PDF with others to collaborate
          </p>
        </div>

        {/* Share with People */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="text-primary-600" size={20} />
            <h3 className="font-semibold text-gray-900">Share with people</h3>
          </div>

          <div className="space-y-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              icon={<Mail size={16} />}
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="view">Can view</option>
                <option value="comment">Can comment</option>
                <option value="edit">Can edit</option>
              </select>

              <Button
                onClick={handleShare}
                loading={loading}
                disabled={!email}
                icon={<Share2 size={16} />}
              >
                Send Invite
              </Button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or share with link</span>
          </div>
        </div>

        {/* Share Link */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link className="text-primary-600" size={20} />
            <h3 className="font-semibold text-gray-900">Get shareable link</h3>
          </div>

          <div className="flex gap-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
            />
            <Button
              onClick={handleCopyLink}
              variant="secondary"
              icon={linkCopied ? <Check size={16} /> : <Copy size={16} />}
            >
              {linkCopied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600">Link access</span>
            <select
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option>Anyone with the link</option>
              <option>Restricted</option>
            </select>
          </div>
        </div>

        {/* Current Collaborators */}
        {pdf?.sharedWith && pdf.sharedWith.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              People with access ({pdf.sharedWith.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pdf.sharedWith.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm bg-primary-600">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 capitalize">
                      {user.permission}
                    </span>
                    <button className="text-gray-400 hover:text-red-600 text-sm">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;