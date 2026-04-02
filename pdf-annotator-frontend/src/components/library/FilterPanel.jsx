import React from 'react';
import { Star, Archive, Users, Globe } from 'lucide-react';
import { Button } from '../ui';

const FilterPanel = ({ filters, onFilterChange }) => {
  const filterOptions = [
    { id: 'all', label: 'All PDFs', icon: null },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'public', label: 'Public', icon: Globe },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
      <div className="space-y-1">
        {filterOptions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
              ${filters.activeFilter === id 
                ? 'bg-primary-50 text-primary-700 font-medium' 
                : 'text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            {Icon && <Icon size={16} />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">File Type</h4>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" className="checkbox" defaultChecked />
          PDF
        </label>
      </div>

      <div className="border-t border-gray-200 mt-4 pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Date Range</h4>
        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
          <option>Any time</option>
          <option>Today</option>
          <option>This week</option>
          <option>This month</option>
          <option>This year</option>
        </select>
      </div>
    </div>
  );
};

export default FilterPanel;