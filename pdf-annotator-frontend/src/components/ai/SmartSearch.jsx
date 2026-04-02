import React, { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input, Button, Loading } from '../ui';
import { aiAPI } from '../../services/api/ai';

const SmartSearch = ({ pdfId, onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const response = await aiAPI.semanticSearch(pdfId, query);
      if (response.success) {
        setResults(response.data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-primary-600" size={20} />
        <h3 className="font-semibold text-gray-900">Smart Search</h3>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question or search for concepts..."
          icon={<Search size={18} />}
        />

        <Button
          type="submit"
          loading={loading}
          disabled={!query.trim()}
          icon={<Sparkles size={16} />}
          className="w-full"
        >
          Search
        </Button>
      </form>

      {loading && <Loading text="Searching..." />}

      {results.length > 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Found {results.length} relevant results
          </p>
          {results.map((result, index) => (
            <div
              key={index}
              onClick={() => onResultClick && onResultClick(result)}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <p className="text-sm text-gray-700 line-clamp-3">
                {result.text}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  Chunk {result.index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full"
                      style={{ width: `${result.relevance * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">
                    {Math.round(result.relevance * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && query && (
        <div className="text-center py-8 text-gray-500">
          No results found for "{query}"
        </div>
      )}
    </div>
  );
};

export default SmartSearch;