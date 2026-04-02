import { useState } from 'react';
import { highlightsAPI } from '../services/api/highlights';
import toast from 'react-hot-toast';

export const useHighlights = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const createHighlight = async (highlightData) => {
    try {
      setLoading(true);
      const response = await highlightsAPI.create(highlightData);
      if (response.success) {
        setHighlights([...highlights, response.data.highlight]);
        toast.success('Highlight created');
        return { success: true, data: response.data.highlight };
      }
    } catch (error) {
      toast.error('Failed to create highlight');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

const getHighlightsByPdf = async (pdfId) => {
  try {
    setLoading(true);
    const response = await highlightsAPI.getByPdfId(pdfId);
    console.log(' Fetched highlights response:', response);
    
    if (response.success && response.data) {
      const fetchedHighlights = response.data.highlights || [];
      console.log(' Setting highlights:', fetchedHighlights);
      setHighlights(fetchedHighlights);
      return response.data;
    }
  } catch (error) {
    console.error(' Failed to load highlights:', error);
    toast.error('Failed to load highlights');
    return { success: false, error };
  } finally {
    setLoading(false);
  }
};

  const deleteHighlight = async (uuid) => {
    try {
      const response = await highlightsAPI.delete(uuid);
      if (response.success) {
        setHighlights(highlights.filter(h => h.uuid !== uuid));
        toast.success('Highlight deleted');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to delete highlight');
      return { success: false };
    }
  };

  const addReaction = async (uuid, reaction) => {
    try {
      const response = await highlightsAPI.addReaction(uuid, { type: reaction });
      if (response.success) {
        toast.success('Reaction added');
        return { success: true };
      }
    } catch (error) {
      toast.error('Failed to add reaction');
      return { success: false };
    }
  };

  return {
    highlights,
    loading,
    createHighlight,
    getHighlightsByPdf,
    deleteHighlight,
    addReaction,
  };
};