import { useState } from 'react';
import { userAPI } from '../services/api/user';
import toast from 'react-hot-toast';

export const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  const getDashboard = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getDashboard();
      if (response.success) {
        setDashboard(response.data);
        return response.data;
      }
    } catch (error) {
      toast.error('Failed to load dashboard');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    try {
      setLoading(true);
      const response = await userAPI.uploadAvatar(file);
      if (response.success) {
        toast.success('Avatar updated');
        return { success: true, data: response.data };
      }
    } catch (error) {
      toast.error('Failed to upload avatar');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (preferences) => {
    try {
      const response = await userAPI.updatePreferences(preferences);
      if (response.success) {
        toast.success('Preferences updated');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to update preferences');
      return { success: false };
    }
  };

  return {
    loading,
    dashboard,
    getDashboard,
    uploadAvatar,
    updatePreferences,
  };
};