import React, { useState, useEffect } from 'react';
import { X, Settings, Save, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'pgy3hub_physics_settings';

const PhysicsControls = ({ simulation, onClose, physicsParamsRef }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Load saved settings from localStorage or use defaults
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('💾 Loaded saved physics settings:', parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load physics settings:', err);
    }
    
    // Check ref, otherwise return defaults
    if (physicsParamsRef?.current) {
      return { ...physicsParamsRef.current };
    }
    
    return {
      collisionRadius: 40,
      collisionStrength: 0.7,
      linkDistance: 120,
      linkStrength: 0.5,
      alphaDecay: 0.0228,
      velocityDecay: 0.4,
    };
  };
  
  // Initialize from localStorage/ref/defaults
  const [settings, setSettings] = useState(loadSettings);

  // Apply settings to simulation
  const applySettings = (newSettings) => {
    if (!simulation) return;
    
    // Update the ref to persist settings across re-renders
    if (physicsParamsRef) {
      physicsParamsRef.current = { ...newSettings };
    }
    
    // Update collision force
    const collisionForce = simulation.force('collision');
    if (collisionForce) {
      collisionForce
        .radius(newSettings.collisionRadius)
        .strength(newSettings.collisionStrength);
    }
    
    // Update link force
    const linkForce = simulation.force('link');
    if (linkForce) {
      linkForce
        .distance(newSettings.linkDistance)
        .strength(newSettings.linkStrength);
    }
    
    // Update simulation parameters
    simulation
      .alphaDecay(newSettings.alphaDecay)
      .velocityDecay(newSettings.velocityDecay);
    
    // Gentle restart to apply changes
    simulation.alpha(0.1).restart();
    
    console.log('🎛️ Physics updated:', newSettings);
  };

  const handleChange = (key, value) => {
    const newSettings = { ...settings, [key]: parseFloat(value) };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('💾 Physics settings saved:', settings);
      setSaveMessage('✓ Settings saved!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (err) {
      console.error('Failed to save physics settings:', err);
      setSaveMessage('✗ Save failed');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleReset = () => {
    const defaults = {
      collisionRadius: 40,
      collisionStrength: 0.7,
      linkDistance: 120,
      linkStrength: 0.5,
      alphaDecay: 0.0228,
      velocityDecay: 0.4,
    };
    setSettings(defaults);
    applySettings(defaults);
    
    // Also clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('💾 Physics settings reset to defaults');
    } catch (err) {
      console.error('Failed to clear saved settings:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 w-80 bg-white rounded-lg shadow-2xl border border-slate-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800">Physics Controls</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            if (onClose) onClose();
          }}
          className="p-1 hover:bg-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Collision Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">
            🔵 Collision Settings
          </h4>
          
          <div>
            <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Collision Radius</span>
              <span className="font-mono font-semibold text-blue-600">
                {settings.collisionRadius}
              </span>
            </label>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={settings.collisionRadius}
              onChange={(e) => handleChange('collisionRadius', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              How far apart nodes stay from each other
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Collision Strength</span>
              <span className="font-mono font-semibold text-blue-600">
                {settings.collisionStrength.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.collisionStrength}
              onChange={(e) => handleChange('collisionStrength', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              How strongly nodes push away from each other (0 = weak, 1 = strong)
            </p>
          </div>
        </div>

        {/* Link Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">
            🔗 Link (Connection) Settings
          </h4>
          
          <div>
            <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Link Distance</span>
              <span className="font-mono font-semibold text-green-600">
                {settings.linkDistance}
              </span>
            </label>
            <input
              type="range"
              min="50"
              max="200"
              step="10"
              value={settings.linkDistance}
              onChange={(e) => handleChange('linkDistance', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Target distance between connected nodes
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Link Strength</span>
              <span className="font-mono font-semibold text-green-600">
                {settings.linkStrength.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.linkStrength}
              onChange={(e) => handleChange('linkStrength', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              How strongly connections pull nodes together (0 = loose, 1 = rigid)
            </p>
          </div>
        </div>

        {/* Simulation Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 border-b pb-1">
            ⚡ Simulation Dynamics
          </h4>
          
          <div>
            <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Alpha Decay</span>
              <span className="font-mono font-semibold text-purple-600">
                {settings.alphaDecay.toFixed(4)}
              </span>
            </label>
            <input
              type="range"
              min="0.01"
              max="0.1"
              step="0.005"
              value={settings.alphaDecay}
              onChange={(e) => handleChange('alphaDecay', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              How quickly simulation cools down (lower = longer movement)
            </p>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Velocity Decay</span>
              <span className="font-mono font-semibold text-purple-600">
                {settings.velocityDecay.toFixed(2)}
              </span>
            </label>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.1"
              value={settings.velocityDecay}
              onChange={(e) => handleChange('velocityDecay', e.target.value)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <p className="text-xs text-slate-500 mt-1">
              Friction/damping (lower = more bouncy, higher = more stable)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSave}
            className="py-2 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            title="Save current settings to browser storage"
          >
            <Save size={16} />
            Save Settings
          </button>
          
          <button
            onClick={handleReset}
            className="py-2 px-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-lg font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2"
            title="Reset to default physics settings"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
        
        {/* Save Confirmation Message */}
        {saveMessage && (
          <div className={`text-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            saveMessage.includes('✓') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-slate-600">
          <p className="font-semibold text-blue-800 mb-1">💡 Tips:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Increase <strong>collision radius</strong> to spread nodes out more</li>
            <li>Lower <strong>link strength</strong> for more organic movement</li>
            <li>Higher <strong>velocity decay</strong> = less bouncing</li>
            <li>Lower <strong>alpha decay</strong> = nodes settle slower</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PhysicsControls;
