# Physics Controls Feature

**Version:** v0.6.0  
**Date:** October 14, 2025  
**Status:** ✅ Complete

## Overview

Live physics controls panel that allows users to adjust D3.js force simulation parameters in real-time and save their preferred settings.

## Features Implemented

### 1. Live Parameter Controls
- **Collision Settings**
  - Collision Radius (20-100): Distance nodes stay apart
  - Collision Strength (0-1): How strongly nodes push away from each other

- **Link Settings**
  - Link Distance (50-200): Target length of connections
  - Link Strength (0-1): How tightly connections pull nodes together

- **Simulation Dynamics**
  - Alpha Decay (0.01-0.1): How fast simulation cools down
  - Velocity Decay (0.1-0.9): Friction/damping (lower = bouncy, higher = stable)

### 2. Real-Time Updates
- Changes apply immediately to the simulation
- No page refresh needed
- Smooth transitions between parameter values

### 3. Settings Persistence
- **Save Button**: Saves current settings to localStorage
- **Auto-Load**: Saved settings automatically load on app start
- **Reset Button**: Resets to default values and clears saved settings
- **Visual Feedback**: Success/error messages when saving

### 4. UI/UX
- Toggle button in top-right corner (gear icon)
- Floating panel with categorized controls
- Color-coded sections (blue, green, purple)
- Tooltips explaining each parameter
- Responsive sliders with live value display

## Technical Implementation

### Files Modified

1. **D3Graph.js**
   - Added `physicsParamsRef` using `useRef` for persistent storage
   - Added `loadPhysicsSettings()` function to load from localStorage on init
   - Modified simulation initialization to use ref values instead of hardcoded
   - Updated simulation updates to preserve user-adjusted parameters
   - Passed ref to PhysicsControls component

2. **PhysicsControls.js**
   - Added localStorage save/load functionality
   - Added `Save` and `RotateCcw` icons from lucide-react
   - Implemented `handleSave()` with visual feedback
   - Updated `handleReset()` to clear localStorage
   - Modified initialization to load from localStorage first
   - Added save confirmation message UI

### Storage Key
```javascript
const STORAGE_KEY = 'pgy3hub_physics_settings';
```

### Data Structure
```javascript
{
  collisionRadius: 40,
  collisionStrength: 0.7,
  linkDistance: 120,
  linkStrength: 0.5,
  alphaDecay: 0.0228,
  velocityDecay: 0.4
}
```

## User Workflow

1. **Open Controls**: Click gear icon in top-right corner
2. **Adjust Parameters**: Use sliders to find optimal settings
3. **Save Settings**: Click "Save Settings" button (turns green on success)
4. **Persistent**: Settings automatically load on next visit
5. **Reset**: Click "Reset" to restore defaults and clear saved settings

## Bug Fixes Applied

### Issue: Settings Reset on Slider Release
**Problem**: PhysicsControls was updating simulation directly, but D3Graph was resetting forces to hardcoded values on re-render.

**Solution**:
- Created `physicsParamsRef` to store settings across re-renders
- Modified simulation updates to preserve existing forces
- PhysicsControls now updates both simulation AND ref
- Result: Settings persist correctly during and after slider interactions

## Benefits

1. **Customization**: Users can optimize physics for their specific use case
2. **Experimentation**: Safe environment to test different parameter combinations
3. **Persistence**: Settings saved across sessions without backend needed
4. **No Breaking Changes**: Default values match previous hardcoded settings
5. **User Control**: Full transparency and control over simulation behavior

## Default Values (Observable Pattern Match)

Based on successful test page implementation:
- Collision Radius: 40 (fixed, not dynamic)
- Collision Strength: 0.7
- Link Distance: 120 (increased from 100)
- Link Strength: 0.5
- Alpha Decay: 0.0228 (D3 default)
- Velocity Decay: 0.4 (D3 default)

## Future Enhancements (Optional)

- [ ] Preset templates (Tight, Loose, Organic, etc.)
- [ ] Export/import settings as JSON
- [ ] Settings sync across devices via backend
- [ ] Visual preview of parameter effects
- [ ] Undo/redo for parameter changes
- [ ] A/B comparison tool for testing settings

## Testing Checklist

- [x] Sliders update simulation in real-time
- [x] Settings persist after slider release
- [x] Save button stores settings to localStorage
- [x] Settings auto-load on app start
- [x] Reset button clears saved settings
- [x] Save confirmation message displays
- [x] No console errors
- [x] Works across browser refresh
- [x] Works with physics toggle on/off
- [x] Works during node dragging

## Related Issues

- ✅ Fixed drift issue with event.active checks
- ✅ Matched test page parameters exactly
- ✅ Achieved collision without unwanted movement
- ✅ Implemented live controls for experimentation
- ✅ Added settings persistence

## Credits

Implementation based on successful Observable physics pattern from cluster-test.html, adapted with persistent settings management.
