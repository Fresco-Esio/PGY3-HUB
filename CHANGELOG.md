P# Changelog

All notable changes to PGY3-HUB will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.7.0] - 2025-10-17 - "Focus Mode Complete"

### Added
- **Focus Mode (Advanced)**
  - Localized physics: Separate D3.js simulation for focused cluster only
  - Multi-level spreading: BFS algorithm finds entire connected component (not just direct neighbors)
  - Frozen nodes: All unconnected nodes are frozen in place (no drift)
  - Smart camera: Auto-centers and zooms to fit focused cluster, with smooth 900ms transitions
  - Camera memory: Saves camera position before entering Focus Mode, restores previous view on exit
  - Visual hierarchy: Focused node (1.2x scale, blue glow), connected nodes (white glow), unconnected nodes (20% opacity), connected edges (3px, bright), unconnected edges (1.5px, 10% opacity)
  - UI-like smooth animation: Tuned force parameters for gentle, professional motion

### Changed
- Physics parameter tuning: Increased link distance, charge strength, and collision radius for more dramatic spreading in Focus Mode
- Increased velocityDecay for smoother, less oscillatory motion
- Focus Mode now uses BFS for multi-level cluster detection (not just direct neighbors)
- Camera reset now restores previous user view, not a fixed default

### Fixed
- No more jarring camera resets when exiting Focus Mode
- No more global node drift when focusing on a cluster
- Performance optimizations for large graphs (100+ nodes)
- Cleaned up simulation memory leaks on Focus Mode exit

### Technical
- Dual simulation architecture: Main simulation + focus simulation
- BFS algorithm for connected component detection
- D3 zoom behavior integration with transform persistence
- Refactored D3Graph.js and App.js for separation of concerns
- Test page (`cluster-test.html`) for rapid prototyping and parameter tuning

### Documentation
- Updated `VERSION.md` - v0.7.0 release notes
- Updated `ROADMAP.md` - Phase 6 marked complete
- Updated `.github/copilot-instructions.md` - Focus Mode system section
- Created `docs/archive/FOCUS_MODE_COMPLETE.md` - Comprehensive implementation guide
- Created `RELEASE_NOTES_v0.7.0.md` - User-friendly release summary
- Moved 9 outdated files to `trash/` and created `CLEANUP_OCT17_2025.md`

---

## [0.6.0] - 2025-10-14 - "Visual Clarity"

### Added
- **Physics Controls Panel** - Live adjustable physics parameters for force simulation
  - 6 adjustable parameters: collision radius/strength, link distance/strength, alpha decay, velocity decay
  - Real-time slider controls with immediate visual feedback
  - Settings persistence via localStorage (`pgy3hub_physics_settings`)
  - Save/Reset buttons with success/error messages
  - Auto-loads saved settings on application start
  - Gear icon toggle button in top-right corner
  - Categorized controls (Collision, Link, Simulation Dynamics)
  - Explanatory tooltips for each parameter
  - No backend required - browser storage only

### Fixed
- **Physics Controls State Reset Bug** - Settings now persist correctly across re-renders
  - Implemented useRef pattern to preserve physics parameters
  - Modified simulation updates to preserve user-adjusted forces
  - PhysicsControls now updates both simulation and persistent ref
  - Slider changes no longer reset to defaults on release

### Technical
- Added `physicsParamsRef` to D3Graph.js for persistent storage
- Created PhysicsControls.js component (311 lines)
- Added localStorage load function in D3Graph initialization
- Modified simulation initialization to use ref values instead of hardcoded parameters
- Updated simulation update logic to preserve existing forces
- Added Lucide React icons: Save, RotateCcw

### Documentation
- Created `docs/features/PHYSICS_CONTROLS_FEATURE.md` - Complete feature documentation
- Updated ROADMAP.md - Marked Physics Controls as complete
- Updated VERSION.md - Documented v0.6.0 progress
- Updated `.github/copilot-instructions.md` - Added Physics Controls system details
- Updated CHANGELOG.md - This file

---

## [0.5.0] - 2025-10-08 - "Edge Label Editing"

### Added
- **Edge Context Menu** - Right-click menu for connection edges
  - Beautiful animated menu with gradient icons
  - Edit label option opens inline modal
  - Delete connection option with visual feedback
  - Clean state management with proper D3 edge handling
- **Edge Label Modal** - Inline editing interface for connection labels
  - Simple, focused modal design
  - Save/Cancel buttons with proper state cleanup
  - Smooth animations and transitions

### Enhanced
- **Edge Interactions** - Improved visual feedback
  - Hover effects: Red glow with increased thickness
  - Click to delete with animated feedback
  - Context menu on right-click
  - Label display on edges with labels

---

## [0.4.0] - 2025-10-07 - "Connected Nodes Tab"

### Added
- **Related Tab** in all node modals
  - Shows all connected nodes with relationships
  - Node type badges with matching colors
  - Click to navigate to connected nodes
  - Empty state handling with helpful message
- **Notes Tab** in all node modals
  - Rich text editor integration (TipTap)
  - Tag creation and management
  - Tag color coding by node type
  - Tag persistence to backend

---

## [0.3.0] - 2025-10-06 - "Modal System Overhaul"

### Changed
- **Full Dark Theme Conversion** for all modals
  - CaseModal, TopicModal, TaskModal, LiteratureModal
  - Consistent dark slate backgrounds
  - Tab accent colors matching node types
  - Improved readability and visual hierarchy

### Removed
- EnhancedEditingForm component (too complex)
- Moved to specialized modal approach for each node type

---

## [0.2.0] - 2025-10-05 - "Quick Wins & UI Polish"

### Added
- **Search Bar** with real-time filtering
  - Searches across labels, titles, node types
  - Highlights matching nodes with yellow glow
  - Dims non-matching nodes to 15% opacity
- **Category Filter Badges** with node counts
  - Topic, Case, Task, Literature filters
  - Shows count for each category
  - Click to filter, click again to show all
- **Connection Mode** for creating edges
  - Toggle button to enable/disable
  - Visual indicators for connection mode
  - Click nodes to create connections

### Removed
- Template System (unused, added complexity)
- CSV Export (not core to vision)
- "Made with Emergent" badge (branding cleanup)

---

## [0.1.0] - 2025-09-XX - "Initial Release"

### Added
- **Mind Map Visualization** using D3.js force-directed graph
- **Four Node Types**: Topic, Case, Task, Literature
- **Interactive Nodes** with drag, click, double-click interactions
- **Force Simulation** with collision detection
- **Node Modals** for editing node details
- **Backend APIs** (FastAPI Python / Express.js Node.js)
- **Local JSON Storage** for data persistence
- **PDF Upload Support** for literature nodes
- **Auto-save** with debounced backend sync

### Technical Foundation
- React 19 with Create React App
- D3.js v7 for force simulation
- TipTap rich text editor
- Tailwind CSS for styling
- Axios for API communication
- Lucide React for icons
- Framer Motion for animations

---

## Version Numbering System

**Format:** `v[MAJOR].[MINOR].[PATCH]`

- **MAJOR** (0.x.x): Complete overhauls, architecture changes, breaking changes
- **MINOR** (x.X.x): New features, significant enhancements
- **PATCH** (x.x.X): Bug fixes, small improvements, polish

---

## Upcoming Features

See [ROADMAP.md](./ROADMAP.md) for planned features and development priorities.

**Next Up (v0.6.0 completion):**
- Focus Mode (toggle-based activation → radial web view)
- Smart Layout Algorithm (fix realign button)
- Enhanced visual hierarchy
- Pattern discovery through visualization
