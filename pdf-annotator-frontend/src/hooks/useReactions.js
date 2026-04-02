import { useState } from 'react';
import { highlightsAPI } from '../services/api/highlights';

export const useReactions = () => {
  const [loading, setLoading] = useState(false);

  const addReaction = async (highlightUuid, reactionType) => {
    try {
      setLoading(true);
      const response = await highlightsAPI.addReaction(highlightUuid, { type: reactionType });
      return response.success;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeReaction = async (highlightUuid) => {
    try {
      setLoading(true);
      const response = await highlightsAPI.removeReaction(highlightUuid);
      return response.success;
    } catch (error) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, addReaction, removeReaction };
};