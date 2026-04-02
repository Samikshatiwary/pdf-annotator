import { useState } from 'react';
import { pdfAPI } from '../services/api/pdf';
import { highlightsAPI } from '../services/api/highlights';

export const useSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchPDFs = async (query) => {
    try {
      setLoading(true);
      const response = await pdfAPI.search(query);
      if (response.success) {
        setResults(response.data.pdfs || []);
        return response.data;
      }
    } catch (error) {
      console.error('Search failed:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const searchHighlights = async (query) => {
    try {
      setLoading(true);
      const response = await highlightsAPI.search(query);
      if (response.success) {
        setResults(response.data.highlights || []);
        return response.data;
      }
    } catch (error) {
      console.error('Search failed:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, searchPDFs, searchHighlights };
};