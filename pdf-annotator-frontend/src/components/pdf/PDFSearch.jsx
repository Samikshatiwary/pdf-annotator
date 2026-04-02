import React, { useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input, Button } from '../ui';

const PDFSearch = ({ onSearch, results = [], currentResult = 0 }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        variant="secondary"
        icon={<Search size={16} />}
      >
        Search
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-10">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in PDF..."
                icon={<Search size={16} />}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {results.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {currentResult + 1} of {results.length} results
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default PDFSearch;