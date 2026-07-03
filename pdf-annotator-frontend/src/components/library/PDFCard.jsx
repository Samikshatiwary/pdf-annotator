import React from 'react';
import { Star, Eye, MessageSquare, MoreVertical, Download, Trash2, Share2, Pencil, Archive } from 'lucide-react';
import { Dropdown, DropdownItem } from '../ui';
import { formatDate, formatFileSize } from '../../utils/helpers';
import { getThumbnailUrl } from '../../utils/pdf';

const PDFCard = ({ pdf, onClick, onDelete, onFavorite, onShare, onRename, onArchive }) => {
  return (
    <div 
      className="card group cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
        {pdf.metadata?.thumbnail || pdf.thumbnail ? (
          <img
            src={getThumbnailUrl(pdf.uuid)}
            alt={pdf.displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
          </div>
        )}
        
        {/* Favorite Badge */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(pdf.uuid);
          }}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform"
        >
          <Star 
            size={16} 
            className={pdf.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}
          />
        </button>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            <Eye size={16} className="inline mr-2" />
            Open PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-gray-900 line-clamp-2 flex-1">
            {pdf.displayName || pdf.originalName}
          </h3>
          <Dropdown
            align="right"
            trigger={
              <button 
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <MoreVertical size={16} />
              </button>
            }
          >
            <DropdownItem icon={<Pencil size={16} />} onClick={(e) => {
              e.stopPropagation();
              onRename && onRename(pdf);
            }}>
              Rename
            </DropdownItem>
            <DropdownItem icon={<Share2 size={16} />} onClick={(e) => {
              e.stopPropagation();
              onShare && onShare(pdf);
            }}>
              Share
            </DropdownItem>
            <DropdownItem icon={<Archive size={16} />} onClick={(e) => {
              e.stopPropagation();
              onArchive && onArchive(pdf.uuid);
            }}>
              {pdf.isArchived ? 'Unarchive' : 'Archive'}
            </DropdownItem>
            <DropdownItem icon={<Trash2 size={16} />} onClick={(e) => {
              e.stopPropagation();
              onDelete(pdf.uuid);
            }}>
              Delete
            </DropdownItem>
          </Dropdown>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>{formatFileSize(pdf.fileSize)}</span>
          <span className="flex items-center gap-1">
            <MessageSquare size={14} />
            {pdf.highlightCount || 0}
          </span>
        </div>

        <p className="text-xs text-gray-400">
          {formatDate(pdf.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default PDFCard;