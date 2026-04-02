import React, { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { pdfAPI } from '../../services/api/pdf';
import LibraryGrid from './LibraryGrid';
import { Loading } from '../ui';

const PublicPDFs = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicPDFs();
  }, []);

  const loadPublicPDFs = async () => {
    try {
      setLoading(true);
      const response = await pdfAPI.getPublic();
      if (response.success) {
        setPdfs(response.data.pdfs || []);
      }
    } catch (error) {
      console.error('Failed to load public PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="text-primary-600" size={24} />
        <h2 className="text-2xl font-bold text-gray-900">Public PDFs</h2>
      </div>

      {loading ? (
        <Loading text="Loading public PDFs..." />
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

export default PublicPDFs;