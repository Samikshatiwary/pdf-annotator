import React, { useState } from 'react';
import { FileText, Sparkles, Copy, Check } from 'lucide-react';
import { Button, Loading } from '../ui';
import {aiAPI} from '../../services/api/ai';
import toast from 'react-hot-toast';

const SummaryPanel = ({ pdfId, text }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSummary = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.summarize(pdfId);
      if (response.success) {
        setSummary(response.data.summary || '');
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="text-primary-600" size={20} />
          <h3 className="font-semibold text-gray-900">AI Summary</h3>
        </div>
        <Sparkles className="text-yellow-500" size={20} />
      </div>

      {!summary && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            Generate an AI-powered summary of this PDF
          </p>
          <Button
            onClick={generateSummary}
            icon={<Sparkles size={16} />}
          >
            Generate Summary
          </Button>
        </div>
      )}

      {loading && (
        <Loading text="Generating summary..." />
      )}

      {summary && !loading && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
            <p className="text-gray-800 leading-relaxed">{summary}</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              icon={copied ? <Check size={16} /> : <Copy size={16} />}
            >
              {copied ? 'Copied' : 'Copy Summary'}
            </Button>
            <Button
              onClick={generateSummary}
              variant="secondary"
              size="sm"
              icon={<Sparkles size={16} />}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPanel;