import React, { useState } from 'react';
import { User, Mail, Calendar } from 'lucide-react';
import { Input, Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api/auth';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const ProfileSettings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          icon={<User size={18} />}
          required
        />

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          icon={<Mail size={18} />}
          required
        />

        <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
          <Calendar size={18} className="text-gray-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Member Since</p>
            <p className="text-sm text-gray-600">{formatDate(user?.createdAt)}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;