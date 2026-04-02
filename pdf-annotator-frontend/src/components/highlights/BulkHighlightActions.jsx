import React, { useState } from 'react';
import { Trash2, Download, Tag, Archive } from 'lucide-react';
import { Button, ConfirmDialog } from '../ui';
import { useBulkActions } from '../../hooks/useBulkActions';

const BulkHighlightActions = ({ selectedHighlights, onActionComplete }) => {
  const { bulkDelete, bulkUpdate, loading } = useBulkActions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleBulkDelete = async () => {
    const result = await bulkDelete(selectedHighlights);
    if (result.success) {
      setShowDeleteConfirm(false);
      onActionComplete();
    }
  };

  const handleBulkTag = async () => {
    // Implement bulk tag functionality
  };

  const handleBulkExport = () => {
    // Implement bulk export functionality
  };

  if (selectedHighlights.length === 0) return null;

  return (
    <>
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-primary-900">
          {selectedHighlights.length} highlight{selectedHighlights.length > 1 ? 's' : ''} selected
        </span>
        
        <div className="flex gap-2">
          <Button
            onClick={handleBulkTag}
            size="sm"
            variant="secondary"
            icon={<Tag size={16} />}
          >
            Tag
          </Button>
          <Button
            onClick={handleBulkExport}
            size="sm"
            variant="secondary"
            icon={<Download size={16} />}
          >
            Export
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            size="sm"
            variant="danger"
            icon={<Trash2 size={16} />}
          >
            Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Highlights"
        message={`Are you sure you want to delete ${selectedHighlights.length} highlight${selectedHighlights.length > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
};

export default BulkHighlightActions;