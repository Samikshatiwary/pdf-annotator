import { useState } from 'react';
import { highlightsAPI } from '../services/api/highlights';
import toast from 'react-hot-toast';

export const useBulkActions = () => {
  const [loading, setLoading] = useState(false);

  const bulkDelete = async (highlightIds) => {
    try {
      setLoading(true);
      const response = await highlightsAPI.bulk('delete', highlightIds);
      if (response.success) {
        toast.success(`${highlightIds.length} highlights deleted`);
        return { success: true };
      }
    } catch (error) {
      toast.error('Bulk delete failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdate = async (highlightIds, updateData) => {
    try {
      setLoading(true);
      const response = await highlightsAPI.bulk('update', highlightIds, updateData);
      if (response.success) {
        toast.success('Highlights updated');
        return { success: true };
      }
    } catch (error) {
      toast.error('Bulk update failed');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { loading, bulkDelete, bulkUpdate };
};