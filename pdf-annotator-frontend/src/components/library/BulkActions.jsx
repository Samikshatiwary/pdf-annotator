import React from 'react';
import { Trash2, Download, Archive, Share2, Tag } from 'lucide-react';
import { Button } from '../ui';

const BulkActions = ({ selectedPdfs, onAction }) => {
  if (selectedPdfs.length === 0) return null;

  return (
    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 flex items-center justify-between">
      <span className="text-sm font-medium text-primary-900">
        {selectedPdfs.length} PDF{selectedPdfs.length > 1 ? 's' : ''} selected
      </span>
      
      <div className="flex gap-2">
        <Button
          onClick={() => onAction('download')}
          size="sm"
          variant="secondary"
          icon={<Download size={16} />}
        >
          Download
        </Button>
        <Button
          onClick={() => onAction('share')}
          size="sm"
          variant="secondary"
          icon={<Share2 size={16} />}
        >
          Share
        </Button>
        <Button
          onClick={() => onAction('archive')}
          size="sm"
          variant="secondary"
          icon={<Archive size={16} />}
        >
          Archive
        </Button>
        <Button
          onClick={() => onAction('delete')}
          size="sm"
          variant="danger"
          icon={<Trash2 size={16} />}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default BulkActions;