import React from 'react';
import { Highlighter, Pen, StickyNote, Type, Eraser } from 'lucide-react';
import { Button, Tooltip } from '../ui';

const ToolBar = ({ activeTool, onToolChange }) => {
  const tools = [
    { id: 'highlight', icon: Highlighter, label: 'Highlight Text' },
    { id: 'draw', icon: Pen, label: 'Draw' },
    { id: 'note', icon: StickyNote, label: 'Add Note' },
    { id: 'text', icon: Type, label: 'Add Text' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 flex items-center gap-1">
      {tools.map(({ id, icon: Icon, label }) => (
        <Tooltip key={id} content={label} position="bottom">
          <Button
            onClick={() => onToolChange(id)}
            variant={activeTool === id ? 'primary' : 'secondary'}
            size="sm"
            icon={<Icon size={18} />}
          />
        </Tooltip>
      ))}
    </div>
  );
};

export default ToolBar;