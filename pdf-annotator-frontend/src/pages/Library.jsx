import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Upload, Grid, List } from 'lucide-react';
import { Button, Modal, ConfirmDialog, Input } from '../components/ui';
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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { pdfs, loading, getAllPDFs, deletePDF, renamePDF, toggleFavorite, toggleArchive } = usePDF();

  // This page backs /library, /favorites and /archived — derive the mode.
  const mode = location.pathname.includes('favorites')
    ? 'favorites'
    : location.pathname.includes('archived')
    ? 'archived'
    : 'library';
  const pageTitle = mode === 'favorites' ? 'Favorites' : mode === 'archived' ? 'Archived' : 'My Library';
  const [viewMode, setViewMode] = useState('grid');
  const [showUpload, setShowUpload] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState(null);
  const [showRename, setShowRename] = useState(false);
  const [pdfToRename, setPdfToRename] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [filters, setFilters] = useState({
    activeFilter: 'all',
    search: searchParams.get('search') || '',
  });
  const [sortBy, setSortBy] = useState('date');

  // Keep the filter in sync when the header search navigates here with ?search=
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setFilters((prev) => ({ ...prev, search: urlSearch }));
  }, [searchParams]);

  useEffect(() => {
    if (mode === 'favorites') getAllPDFs({ isFavorite: true });
    else if (mode === 'archived') getAllPDFs({ isArchived: true });
    else getAllPDFs();
  }, [mode]);

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

  const handleRename = (pdf) => {
    setPdfToRename(pdf);
    setRenameValue(pdf.displayName || pdf.originalName || '');
    setShowRename(true);
  };

  const handleRenameConfirm = async () => {
    const name = renameValue.trim();
    if (!pdfToRename || !name) return;
    await renamePDF(pdfToRename.uuid, name);
    setShowRename(false);
    setPdfToRename(null);
    setRenameValue('');
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
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
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
              onRename={handleRename}
              onArchive={toggleArchive}
            />
          ) : (
            <LibraryList
              pdfs={filteredPdfs}
              loading={loading}
              onPdfClick={handlePdfClick}
              onDelete={handleDeleteClick}
              onFavorite={toggleFavorite}
              onRename={handleRename}
              onArchive={toggleArchive}
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

      {/* Rename Modal */}
      <Modal
        isOpen={showRename}
        onClose={() => setShowRename(false)}
        title="Rename PDF"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter a new name"
            onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowRename(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm} disabled={!renameValue.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

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