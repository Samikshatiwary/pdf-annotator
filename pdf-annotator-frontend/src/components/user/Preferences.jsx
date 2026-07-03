import React, { useState, useEffect } from 'react';
import { Settings, Palette } from 'lucide-react';
import { Button } from '../ui';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';
import { highlightColors } from '../../utils/annotations';
import { applyTheme } from '../../utils/theme';

const Preferences = () => {
  const { updatePreferences, loading } = useUser();
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    theme: 'light',
    defaultHighlightColor: '#ffff00',
    autoSave: true,
  });

  // Load the user's saved preferences.
  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        theme: user.preferences.theme || 'light',
        defaultHighlightColor: user.preferences.defaultHighlightColor || '#ffff00',
        autoSave: user.preferences.autoSave ?? true,
      });
    }
  }, [user]);

  const handleSave = async () => {
    // Backend accepts theme (light|dark), defaultHighlightColor, autoSave.
    const result = await updatePreferences({
      theme: preferences.theme,
      defaultHighlightColor: preferences.defaultHighlightColor,
      autoSave: preferences.autoSave,
    });
    if (result?.success) {
      applyTheme(preferences.theme);
    }
  };

  return (
    <div className="card max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Preferences</h3>

      <div className="space-y-6">
        {/* Theme */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette size={18} className="text-gray-600" />
            <h4 className="font-medium text-gray-900">Appearance</h4>
          </div>
          <div className="flex gap-3">
            {['light', 'dark'].map((theme) => (
              <button
                key={theme}
                onClick={() => {
                  setPreferences({ ...preferences, theme });
                  applyTheme(theme); // live preview before saving
                }}
                className={`px-4 py-2 border-2 rounded-lg capitalize transition-all ${
                  preferences.theme === theme
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Default Highlight Color */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Default Highlight Color</h4>
          <div className="flex gap-2">
            {highlightColors.map((color) => (
              <button
                key={color.value}
                onClick={() => setPreferences({ ...preferences, defaultHighlightColor: color.value })}
                className={`w-10 h-10 rounded ${color.class} border-2 transition-all ${
                  preferences.defaultHighlightColor === color.value
                    ? 'border-gray-900 scale-110'
                    : 'border-transparent hover:border-gray-300'
                }`}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Auto Save */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Settings size={18} className="text-gray-600" />
            <h4 className="font-medium text-gray-900">General</h4>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Auto-save highlights</span>
              <input
                type="checkbox"
                checked={preferences.autoSave}
                onChange={(e) => setPreferences({ ...preferences, autoSave: e.target.checked })}
                className="toggle"
              />
            </label>
          </div>
        </div>

        <Button onClick={handleSave} loading={loading}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
};

export default Preferences;