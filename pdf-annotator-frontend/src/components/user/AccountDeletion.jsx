import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Input, Button, ConfirmDialog } from '../ui';
import { userAPI } from '../../services/api/user';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AccountDeletion = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      toast.error('Please enter your password to confirm');
      return;
    }

    try {
      setLoading(true);
      await userAPI.deleteAccount(password);
      toast.success('Account deleted successfully');
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="card max-w-2xl border-red-200">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="text-red-600" size={20} />
          <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
          <p className="text-sm text-red-700 mb-4">
            Once you delete your account, there is no going back. This action cannot be undone.
          </p>
          <ul className="text-sm text-red-700 space-y-1 mb-4">
            <li>• All your PDFs will be permanently deleted</li>
            <li>• All highlights and annotations will be removed</li>
            <li>• Your account data will be erased</li>
            <li>• Shared PDFs will no longer be accessible</li>
          </ul>
        </div>

        <Button
          onClick={() => setShowConfirm(true)}
          variant="danger"
          icon={<Trash2 size={16} />}
        >
          Delete My Account
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setPassword('');
        }}
        onConfirm={handleDelete}
        title="Delete Account"
        confirmText="Delete Account"
        variant="danger"
        message={
          <div className="space-y-4">
            <p className="text-gray-700">
              This action is permanent and cannot be undone. All your data will be permanently deleted.
            </p>
            <Input
              label="Enter your password to confirm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>
        }
      />
    </>
  );
};

export default AccountDeletion;