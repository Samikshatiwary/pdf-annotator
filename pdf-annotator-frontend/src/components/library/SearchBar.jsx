import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../ui';
import { debounce } from '../../utils/helpers';

const SearchBar = ({ onSearch, placeholder = 'Search PDFs...' }) => {
  const [query, setQuery] = useState('');

  const debouncedSearch = debounce((value) => {
    onSearch(value);
  }, 300);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        icon={<Search size={18} />}
        className="pr-10"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;