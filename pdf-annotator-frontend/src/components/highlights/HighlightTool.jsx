import React, { useState } from 'react';
import { Highlighter } from 'lucide-react';
import { Button } from '../ui';
import ColorPicker from './ColorPicker';
import { useHighlights } from '../../hooks/useHighlights';
import { createHighlightData } from '../../utils/annotations';

const HighlightTool = ({ pdfId, selectedText, onHighlightCreated }) => {
  const { createHighlight, loading } = useHighlights();
  const [selectedColor, setSelectedColor] = useState('#ffff00');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);

  const handleCreateHighlight = async () => {
    if (!selectedText) return;

    const highlightData = createHighlightData(selectedText, selectedText.pageNumber, selectedColor);
    
    const payload = {
      pdfId,
      ...highlightData,
      note: note ? { content: note, isPrivate: true } : undefined,
    };

    const result = await createHighlight(payload);
    if (result.success) {
      setNote('');
      setShowNoteInput(false);
      if (onHighlightCreated) {
        onHighlightCreated(result.data);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Highlighter size={20} className="text-primary-600" />
        <h3 className="font-semibold text-gray-900">Create Highlight</h3>
      </div>

      {selectedText && (
        <div className="bg-gray-50 rounded p-3">
          <p className="text-sm text-gray-700 line-clamp-3">
            "{selectedText.text}"
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Page {selectedText.pageNumber}
          </p>
        </div>
      )}

      <ColorPicker
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
      />

      {showNoteInput ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCreateHighlight}
              loading={loading}
              disabled={!selectedText}
              size="sm"
              className="flex-1"
            >
              Save Highlight
            </Button>
            <Button
              onClick={() => {
                setShowNoteInput(false);
                setNote('');
              }}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            onClick={handleCreateHighlight}
            loading={loading}
            disabled={!selectedText}
            size="sm"
            className="flex-1"
          >
            Highlight
          </Button>
          <Button
            onClick={() => setShowNoteInput(true)}
            variant="secondary"
            size="sm"
          >
            Add Note
          </Button>
        </div>
      )}
    </div>
  );
};

export default HighlightTool;