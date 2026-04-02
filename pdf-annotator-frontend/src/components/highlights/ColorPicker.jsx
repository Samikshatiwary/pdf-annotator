import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { highlightColors } from '../../utils/annotations';

const ColorPicker = ({ selectedColor, onColorChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        <div
          className="w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: selectedColor }}
        />
        <span className="text-sm text-gray-700">Color</span>
      </button>

      {showPicker && (
        <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-10">
          <div className="grid grid-cols-5 gap-2">
            {highlightColors.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  onColorChange(color.value);
                  setShowPicker(false);
                }}
                className={`w-10 h-10 rounded ${color.class} border-2 transition-all relative
                  ${selectedColor === color.value ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-300'}
                `}
                title={color.name}
              >
                {selectedColor === color.value && (
                  <Check size={16} className="absolute inset-0 m-auto text-gray-900" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;