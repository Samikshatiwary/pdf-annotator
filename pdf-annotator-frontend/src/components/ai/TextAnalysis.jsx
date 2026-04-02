import React, { useState } from 'react';
import { BarChart3, BookOpen, Clock } from 'lucide-react';
import { Button, Loading } from '../ui';
import { aiAPI } from '../../services/api/ai';

const TextAnalysis = ({ pdfId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeText = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.analyzeText(pdfId);
      if (response.success) {
        setAnalysis(response.data);
      }
    } catch (error) {
      console.error('Failed to analyze text:', error);
    } finally {
      setLoading(false);
    }
  };

  const getComplexityColor = (complexity) => {
    switch (complexity?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-primary-600" size={20} />
          <h3 className="font-semibold text-gray-900">Text Analysis</h3>
        </div>
      </div>

      {!analysis && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            Analyze document complexity and content
          </p>
          <Button onClick={analyzeText}>Analyze Document</Button>
        </div>
      )}

      {loading && <Loading text="Analyzing document..." />}

      {analysis && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={16} className="text-gray-600" />
                <span className="text-sm text-gray-600">Word Count</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {analysis.wordCount?.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-gray-600" />
                <span className="text-sm text-gray-600">Sentences</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {analysis.sentenceCount}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Readability Score
              </span>
              <span className="text-sm font-bold text-gray-900">
                {analysis.readabilityScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{ width: `${analysis.readabilityScore}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <span className="text-sm font-medium text-gray-700">
              Overall Sentiment
            </span>
            <p className="text-lg font-semibold text-primary-700 mt-1">
              {analysis.sentiment}
            </p>
          </div>

          {analysis.topics && analysis.topics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Main Topics
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextAnalysis;