import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { pdfAPI } from '../../services/api/pdf';
import LibraryGrid from './LibraryGrid';
import { Loading } from '../ui';

const SharedPDFs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedPDFs();
  }, []);

  const loadSharedPDFs = async () => {
    try {
      setLoading(true);
      const response = await pdfAPI.getShared();
      if (response.success) {
        setPdfs(response.data.pdfs || []);
      }
    } catch (error) {
      console.error('Failed to load shared PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="text-primary-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Shared with Me</h2>
      </div>

      {loading ? (
        <Loading text="Loading shared PDFs..." />
      ) : (
        <LibraryGrid
          pdfs={pdfs}
          loading={false}
          onPdfClick={(pdf) => window.location.href = `/pdf/${pdf.uuid}`}
        />
      )}
    </div>
  );
};

export default SharedPDFs;