import { useState } from 'react';
import { pdfAPI } from '../services/api/pdf';
import toast from 'react-hot-toast';

export const useSharing = () => {
  const [loading, setLoading] = useState(false);

  const sharePDF = async (uuid, shareData) => {
    try {
      setLoading(true);
      const response = await pdfAPI.share(uuid, shareData);
      if (response.success) {
        toast.success('PDF shared successfully');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to share PDF');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const revokeShare = async (uuid, userId) => {
    try {
      const response = await pdfAPI.revokeShare(uuid, userId);
      if (response.success) {
        toast.success('Access revoked');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to revoke access');
      return { success: false };
    }
  };

  return { loading, sharePDF, revokeShare };
};