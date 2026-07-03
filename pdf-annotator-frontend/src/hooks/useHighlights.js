import { useState } from 'react';
import { highlightsAPI } from '../services/api/highlights';
import { indexedDBService } from '../services/offline/indexedDB';
import toast from 'react-hot-toast';

export const useHighlights = () => {
  const [highlights, setHighlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const createHighlight = async (highlightData) => {
    // Offline: queue the create and optimistically show it; it replays on reconnect.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await indexedDBService.queueMutation('CREATE_HIGHLIGHT', highlightData);
      const optimistic = {
        ...highlightData,
        uuid: `pending-${Date.now()}`,
        pending: true,
        createdAt: new Date().toISOString(),
      };
      setHighlights((prev) => [...prev, optimistic]);
      toast.success('Highlight saved offline — will sync when online');
      return { success: true, data: optimistic, offline: true };
    }

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
      setHighlights(fetchedHighlights);
      // Cache for offline viewing.
      indexedDBService.saveHighlights(fetchedHighlights).catch(() => {});
      return response.data;
    }
  } catch (error) {
    console.error(' Failed to load highlights:', error);
    // Offline / network error: fall back to cached highlights if we have them.
    try {
      const cached = await indexedDBService.getHighlights(pdfId);
      if (cached && cached.length > 0) {
        setHighlights(cached);
        toast('Showing offline highlights', { icon: '📴' });
        return { success: true, highlights: cached, offline: true };
      }
    } catch (cacheErr) {
      console.error('Offline highlight read failed:', cacheErr);
    }
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