import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Grid, List } from 'lucide-react';
import { Button, Modal, ConfirmDialog } from '../components/ui';
import LibraryGrid from '../components/library/LibraryGrid';
import LibraryList from '../components/library/LibraryList';
import SearchBar from '../components/library/SearchBar';
import FilterPanel from '../components/library/FilterPanel';
import SortOptions from '../components/library/SortOptions';
import ViewToggle from '../components/library/ViewToggle';
import PDFUpload from '../components/pdf/PDFUpload';
import ShareManager from '../components/library/ShareManager';
import { usePDF } from '../hooks/usePDF';
import { filterPDFs, sortPDFs } from '../utils/search';

const Library = () => {
  const navigate = useNavigate();
  const { pdfs, loading, getAllPDFs, deletePDF, toggleFavorite } = usePDF();
  const [viewMode, setViewMode] = useState('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);
  
  const [filters, setFilters] = useState({
    activeFilter: 'all',
    search: '',
  });
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    getAllPDFs();
  }, []);

  const handleSearch = (query) => {
    setFilters({ ...filters, search: query });
  };

  const handleFilterChange = (filter) => {
    setFilters({ ...filters, activeFilter: filter });
  };

  const handlePdfClick = (pdf) => {
    navigate(`/pdf/${pdf.uuid}`);
  };

  const handleDeleteClick = (uuid) => {
    setPdfToDelete(uuid);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (pdfToDelete) {
      await deletePDF(pdfToDelete);
      setShowDeleteConfirm(false);
      setPdfToDelete(null);
    }
  };

  const handleShare = (pdf) => {
    setSelectedPdf(pdf);
    setShowShare(true);
  };

  const handleUploadComplete = (data) => {
    setShowUpload(false);
    getAllPDFs();
  };

  // Apply filters and sorting
  let filteredPdfs = filterPDFs(pdfs, filters);
  filteredPdfs = sortPDFs(filteredPdfs, sortBy);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          <p className="text-gray-600 mt-1">Manage and organize your PDFs</p>
        </div>
        <Button onClick={() => setShowUpload(true)} icon={<Upload size={16} />}>
          Upload PDF
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="flex items-center gap-2">
          <SortOptions sortBy={sortBy} onSortChange={setSortBy} />
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {/* PDFs List/Grid */}
        <div className="flex-1">
          {viewMode === 'grid' ? (
            <LibraryGrid
              pdfs={filteredPdfs}
              loading={loading}
              onPdfClick={handlePdfClick}
              onDelete={handleDeleteClick}
              onFavorite={toggleFavorite}
              onShare={handleShare}
            />
          ) : (
            <LibraryList
              pdfs={filteredPdfs}
              loading={loading}
              onPdfClick={handlePdfClick}
              onDelete={handleDeleteClick}
              onFavorite={toggleFavorite}
            />
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload PDF"
        size="lg"
      >
        <PDFUpload onUploadComplete={handleUploadComplete} />
      </Modal>

      {/* Share Modal */}
      {selectedPdf && (
        <ShareManager
          pdf={selectedPdf}
          isOpen={showShare}
          onClose={() => {
            setShowShare(false);
            setSelectedPdf(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete PDF"
        message="Are you sure you want to delete this PDF? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Library;