import React from 'react';
import { File, Star, Archive, MoreVertical, Download, Trash2, Pencil } from 'lucide-react';
import { Dropdown, DropdownItem, Loading } from '../ui';
import { formatDate, formatFileSize } from '../../utils/helpers';

const LibraryList = ({ pdfs, loading, onPdfClick, onDelete, onFavorite, onRename, onArchive }) => {
  if (loading) {
    return <Loading text="Loading PDFs..." />;
  }

  if (!pdfs || pdfs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No PDFs to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Highlights
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Added
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pdfs.map((pdf) => (
            <tr 
              key={pdf.uuid} 
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onPdfClick(pdf)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <File className="text-primary-600 mr-3" size={20} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {pdf.displayName || pdf.originalName}
                    </div>
                    {pdf.metadata?.title && (
                      <div className="text-xs text-gray-500">{pdf.metadata.title}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatFileSize(pdf.fileSize)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {pdf.highlightCount || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(pdf.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {pdf.isFavorite && (
                    <Star className="text-yellow-500" size={16} fill="currentColor" />
                  )}
                  {pdf.isArchived && (
                    <Archive className="text-gray-400" size={16} />
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Dropdown
                  align="right"
                  trigger={
                    <button 
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical size={20} />
                    </button>
                  }
                >
                  <DropdownItem
                    icon={<Star size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite(pdf.uuid);
                    }}
                  >
                    {pdf.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownItem>
                  <DropdownItem
                    icon={<Pencil size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRename && onRename(pdf);
                    }}
                  >
                    Rename
                  </DropdownItem>
                  <DropdownItem
                    icon={<Archive size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive && onArchive(pdf.uuid);
                    }}
                  >
                    {pdf.isArchived ? 'Unarchive' : 'Archive'}
                  </DropdownItem>
                  <DropdownItem
                    icon={<Trash2 size={16} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(pdf.uuid);
                    }}
                  >
                    Delete
                  </DropdownItem>
                </Dropdown>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LibraryList;