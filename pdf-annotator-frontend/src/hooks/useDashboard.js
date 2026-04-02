import { useState, useEffect } from 'react';
import { userAPI } from '../services/api/user';
import { pdfAPI } from '../services/api/pdf';
import { highlightsAPI } from '../services/api/highlights';

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Call APIs separately to catch individual errors
      const dashboardPromise = userAPI.getDashboard().catch(e => {
        console.error('Dashboard API error:', e);
        return { success: false, data: null };
      });
      
      const pdfStatsPromise = pdfAPI.getStats().catch(e => {
        console.error('PDF stats error:', e);
        return { success: false, data: { overview: { totalPDFs: 0 } } };
      });
      
      const highlightStatsPromise = highlightsAPI.getStats().catch(e => {
        console.error('Highlight stats error:', e);
        return { success: false, data: { overview: { totalHighlights: 0 } } };
      });

      const [dashboardData, pdfStats, highlightStats] = await Promise.all([
        dashboardPromise,
        pdfStatsPromise,
        highlightStatsPromise
      ]);

      setStats({
        dashboard: dashboardData.data || {},
        pdfs: pdfStats.data || {},
        highlights: highlightStats.data || {},
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setStats({
        dashboard: {},
        pdfs: { overview: { totalPDFs: 0 } },
        highlights: { overview: { totalHighlights: 0 } }
      });
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, refresh: loadDashboard };
};