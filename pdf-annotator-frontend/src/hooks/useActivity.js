import { useState, useEffect } from 'react';
import { userAPI } from '../services/api/user';

export const useActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getActivity();
      if (response.success) {
        setActivities(response.data.activities || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return { activities, loading, refresh: loadActivities };
};