import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { Dropdown, DropdownItem } from '../ui';

const SortOptions = ({ sortBy, onSortChange }) => {
  const sortOptions = [
    { value: 'date', label: 'Date Added' },
    { value: 'name', label: 'Name' },
    { value: 'size', label: 'File Size' },
    { value: 'highlights', label: 'Most Highlights' },
  ];

  const currentSort = sortOptions.find(opt => opt.value === sortBy);

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-sm">
          <ArrowUpDown size={16} />
          <span>Sort: {currentSort?.label}</span>
        </button>
      }
    >
      {sortOptions.map((option) => (
        <DropdownItem
          key={option.value}
          onClick={() => onSortChange(option.value)}
        >
          <span className={sortBy === option.value ? 'font-medium text-primary-600' : ''}>
            {option.label}
          </span>
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default SortOptions;