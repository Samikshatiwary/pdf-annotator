import React, { useState } from 'react';
import { Tag, Sparkles, RefreshCw } from 'lucide-react';
import { Button, Loading } from '../ui';
import {aiAPI} from '../../services/api/ai';
import toast from 'react-hot-toast';

const KeyPhrasesPanel = ({ pdfId }) => {
  const [keyPhrases, setKeyPhrases] = useState([]);
  const [loading, setLoading] = useState(false);

  const extractKeyPhrases = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.extractKeyPhrases(pdfId);
      if (response.success) {
        setKeyPhrases(response.data.keyPhrases || []);
      }
    } catch (error) {
      console.error('Failed to extract key phrases:', error);
      toast.error('Failed to extract key phrases');
    } finally {
      setLoading(false);
    }
  };

  const getImportanceColor = (importance) => {
    if (importance >= 0.8) return 'bg-green-100 text-green-800';
    if (importance >= 0.6) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="text-primary-600" size={20} />
          <h3 className="font-semibold text-gray-900">Key Phrases</h3>
        </div>
        {keyPhrases.length > 0 && (
          <Button
            onClick={extractKeyPhrases}
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
        )}
      </div>

      {!keyPhrases.length && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            Extract important phrases from this PDF
          </p>
          <Button
            onClick={extractKeyPhrases}
            icon={<Sparkles size={16} />}
          >
            Extract Key Phrases
          </Button>
        </div>
      )}

      {loading && (
        <Loading text="Extracting key phrases..." />
      )}

      {keyPhrases.length > 0 && !loading && (
        <div className="space-y-3">
          {keyPhrases.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getImportanceColor(item.importance)}`}>
                  {item.phrase}
                </span>
                <span className="text-xs text-gray-500">
                  {item.count} occurrences
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${item.importance * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-12 text-right">
                  {Math.round(item.importance * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeyPhrasesPanel;