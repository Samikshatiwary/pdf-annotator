import React, { useState } from 'react';
import { StickyNote, Save, X } from 'lucide-react';
import { Button, Input } from '../ui';

const NotesTool = ({ highlight, onSave, onCancel }) => {
  const [noteContent, setNoteContent] = useState(highlight?.note?.content || '');
  const [tags, setTags] = useState(highlight?.tags?.join(', ') || '');
  const [isPrivate, setIsPrivate] = useState(highlight?.note?.isPrivate ?? true);

  const handleSave = () => {
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    onSave({
      note: {
        content: noteContent,
        isPrivate,
      },
      tags: tagsArray,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote size={20} className="text-primary-600" />
          <h3 className="font-semibold text-gray-900">Add Note</h3>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <textarea
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        placeholder="Write your note here..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        rows={4}
      />

      <Input
        label="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="e.g., important, review, question"
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="checkbox"
        />
        <span className="text-sm text-gray-700">Private note</span>
      </label>

      <div className="flex gap-2">
        <Button onClick={handleSave} icon={<Save size={16} />} className="flex-1">
          Save Note
        </Button>
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default NotesTool;