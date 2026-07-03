import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input, Button } from '../ui';
import { authAPI } from '../../services/api/auth';
import toast from 'react-hot-toast';
import { validatePassword, validatePasswordMatch } from '../../utils/validation';

const PasswordChange = () => {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    const passwordValidation = validatePassword(formData.newPassword);
    if (!passwordValidation.valid) {
      newErrors.newPassword = passwordValidation.error;
    }

    const matchValidation = validatePasswordMatch(formData.newPassword, formData.confirmPassword);
    if (!matchValidation.valid) {
      newErrors.confirmPassword = matchValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setLoading(true);
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      toast.success('Password changed successfully');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Input
            label="Current Password"
            name="currentPassword"
            type={showPasswords.current ? 'text' : 'password'}
            value={formData.currentPassword}
            onChange={handleChange}
            error={errors.currentPassword}
            icon={<Lock size={18} />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="New Password"
            name="newPassword"
            type={showPasswords.new ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            icon={<Lock size={18} />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            icon={<Lock size={18} />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Password must be at least 8 characters long
          </p>
        </div>

        <Button type="submit" loading={loading}>
          Change Password
        </Button>
      </form>
    </div>
  );
};

export default PasswordChange;