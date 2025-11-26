# PGY3-HUB Version History

**Current Version:** v0.7.3  
**Last Updated:** November 25, 2025

---

## Version Numbering System

**Format:** `v[MAJOR].[MINOR].[PATCH]`

- **MAJOR** (0.x.x): Complete overhauls, architecture changes, or major feature sets
- **MINOR** (x.X.x): New features, significant enhancements
- **PATCH** (x.x.X): Bug fixes, small improvements, polish

---

## Release History

### v0.7.3 - "Realignment Stability Fix" (Nov 25, 2025) - CURRENT
**Status:** ✅ Complete  
**Last Update:** November 25, 2025

**Focus:** Fixed critical re-render and flicker issues during realignment

**Bug Fixes:**
- [x] **Removed setMindMapData from realignment completion**
  - Eliminated React state updates during D3 simulation settlement
  - Prevented D3Graph re-initialization and physics settings reload
  - Positions now persist naturally through auto-save mechanism (800ms debounce)
  - No more "Loaded saved physics settings" messages after realignment
  
- [x] **Fixed dependency array in forceLayout callback**
  - Removed unused `setMindMapData` from dependency array
  - Prevents function recreation on every mindMapData change
  - Eliminates re-render cascades during node movement
  
- [x] **Cleaned up duplicate code blocks**
  - Removed duplicate radial force removal logic
  - Streamlined onSimulationEnd callback
  - Single clear execution path without redundant operations
  
- [x] **Improved toast notification accuracy**
  - Changed "hierarchical layout" to "organizing by connections and type"
  - Accurately describes connection-aware clustering behavior
  - Users understand what the realignment actually does

**Technical Details:**
- Realignment now operates purely in D3's simulation layer
- D3Graph's prevPositionsRef tracks positions without triggering React updates
- Auto-save handles persistence asynchronously
- Zero React state changes during active realignment
- Result: Smooth, flicker-free node repositioning

---

### v0.7.2 - "Connection-Aware Realignment" (Nov 24, 2025)
**Status:** ✅ Complete  
**Last Update:** November 24, 2025

**Focus:** Enhanced realignment algorithm with connection awareness and stability improvements

**Completed Features:**
- [x] **Always-On Simulation Architecture**
  - Eliminated stop/start simulation conflicts
  - Single continuous simulation with dynamic force modification
  - Instant realignment response (no waiting for simulation to stop)
  - Temporary radial force applied during realignment, removed when settled
  
- [x] **Connection-Aware Force Layout**
  - Stronger link force (0.8 strength) to cluster connected nodes
  - Shorter link distance (120px) keeps related nodes close together
  - Reduced repulsion (-300 charge) allows tighter grouping
  - Connected nodes form readable clusters for easy relationship scanning
  
- [x] **Hierarchical + Connection Hybrid**
  - Radial force positions node types hierarchically (Topics center, Tasks outer)
  - Link force keeps connected nodes together within their hierarchical layer
  - Best of both worlds: organized by type AND by relationships
  
- [x] **Drag Behavior Improvements**
  - Reduced drag threshold (5px → 2px) for more responsive clicking
  - Fixed node locking issues after realignment
  - Removed 1-second freeze period that blocked dragging
  - Smooth drag-to-position without snap-back behavior
  
- [x] **Stability & Anti-Jitter Guards**
  - Extended guard period (1 second) after realignment to prevent position conflicts
  - Blocks mindMapData updates during realignment window
  - Prevents D3Graph from restarting simulation immediately after realignment
  - Eliminates visual jitter when dragging nodes post-realignment

**Technical Implementation:**
- Modified existing simulation forces instead of creating new simulation
- Radial force automatically removed when simulation settles (alpha → 0)
- One-time 'end' event listener with self-removal pattern
- Guard flag `window.isCustomRealigning` with extended timeout
- Force parameter null checks for robustness
- Connection-aware force parameters: link 0.8/120px, charge -300, collision 20px radius

**Bug Fixes:**
- Fixed infinite loop where realignment triggered repeatedly
- Fixed nodes reverting to old positions after drag
- Fixed inability to drag nodes immediately after realignment
- Fixed simulation restart causing jitter during post-realignment drags
- Fixed TypeError from undefined force properties

**Performance:**
- No simulation stop/start overhead
- Instant response to realignment clicks
- Smooth transitions without conflicts
- Minimal re-renders after realignment

**Why This Matters:**
- Realignment now emphasizes RELATIONSHIPS as much as hierarchy
- Connected nodes cluster together = easy to see what's linked
- Stable behavior = professional UX, no confusion
- Always-responsive = feels fluid and intentional
- Supports visual thinking: "show me what's connected"

---

### v0.7.1 - "Smart Layout" (Nov 23, 2025)
**Status:** ✅ Complete  
**Last Update:** November 23, 2025

**Focus:** Intelligent cluster detection and hierarchical layout

**Completed Features:**
- [x] **Cluster Detection Algorithm**
  - BFS-based connected component detection
  - Identifies Topic nodes as cluster centers
  - Groups Cases/Literature by primary Topic connection
  - Handles orphaned nodes intelligently
  
- [x] **Hierarchical Layout System**
  - Topics positioned as cluster centers in circular arrangement
  - Cases/Literature orbit around their topic centers
  - Clear visual separation between clusters (400px)
  - Configurable orbit radius (150px) for node spacing
  
- [x] **Smart Realign Button**
  - Fixed "Realign Nodes" button to use intelligent clustering
  - Toast feedback showing number of clusters detected
  - Smooth animations during realignment
  - Respects physics enabled/disabled state

**Technical Implementation:**
- `detectClusters()` function with BFS algorithm
- Adjacency list for efficient graph traversal
- Circular cluster positioning with angle-based layout
- Integration with existing D3.js force simulation
- Preserved user-adjusted physics parameters

**Why This Matters:**
- Default layout is now organized and intelligible
- Realign button actually works intelligently
- Matches mental model: Topics → Cases/Literature
- Reduces manual node positioning effort
- Supports "visual thinking" core purpose

---

### v0.7.0 - "Focus Mode Complete" (Oct 17, 2025)
**Status:** ✅ Complete  
**Last Update:** October 17, 2025

**Focus:** Advanced Focus Mode with localized physics and camera intelligence

**Completed Features:**
- [x] **Localized Physics for Focus Mode**
  - Separate D3.js simulation for focused cluster only
  - Multi-level spreading using BFS (entire connected component)
  - Freezes unconnected nodes (no drift or movement)
  - Dramatic force parameters for visual clarity
  - Smooth UI-like animation with tuned damping
  
- [x] **Smart Camera System**
  - Auto-centers and zooms to fit focused cluster
  - Saves camera position before entering Focus Mode
  - Restores previous view on exit (not fixed default)
  - Smooth 900ms transitions
  - Bounding box calculation with padding
  
- [x] **Visual Hierarchy Enhancements**
  - Focused node: 1.2x scale, bright blue glow
  - Connected nodes: Full opacity, subtle white glow
  - Unconnected nodes: 20% opacity, dimmed
  - Connected edges: Thicker (3px), brighter
  - Unconnected edges: Thin (1.5px), 10% opacity
  
- [x] **Physics Parameter Tuning**
  - Iteratively optimized for smooth spreading
  - Increased link distance for dramatic expansion
  - Tuned velocityDecay for gentle settling (no recoil)
  - Test page and main app physics synchronized

**Technical Achievements:**
- Dual simulation architecture (main + focus)
- BFS algorithm for connected component detection
- D3 zoom behavior integration with transform persistence
- Performance optimizations for large graphs
- Clean separation of visual and physics systems

**Design Philosophy:**
- "Calm, focused digital studio" - smooth, intentional interactions
- No jarring resets - preserves user's exploration context
- Visual clarity through motion and hierarchy
- Professional, UI-like animations (not chaotic physics)

---

### v0.6.0 - "Visual Clarity" (Oct 8-14, 2025)
**Status:** ✅ Complete  
**Last Update:** October 14, 2025 (Physics Controls with persistence added)

**Focus:** Visual organization and connection clarity

**Completed Features:**
- [x] **Physics Controls Panel** - Live adjustable physics parameters
  - Real-time collision, link, and simulation dynamics controls
  - Settings persistence via localStorage
  - Save/Reset functionality with visual feedback
  - Fixed state reset bug with useRef pattern
  - Auto-loads saved settings on app start

**Changes:**
- [x] Vision clarification: Visual thinking tool (not task manager)
- [x] Reprioritized roadmap based on core purpose
- [x] Documentation reorganization (cleaned up 40+ MD files → organized structure)
- [x] Version system established (v[MAJOR].[MINOR].[PATCH])
- [x] AI guidelines created for consistent documentation practices
- [x] Focus Mode design clarified (toggle-based)
- [ ] Focus Mode implementation (ready to start)

**Documentation:**
- Created `/docs/` folder structure (development, testing, features, archive)
- Created `VERSION.md` with version history
- Created `.github/AI_GUIDELINES.md` with mandatory practices
- Updated `.github/copilot-instructions.md` with version requirements
- Cleaned up root directory (4 essential docs)
- Archived 8 completed implementation logs
- Deleted 12 redundant/obsolete files

**Technical:**
- Updated `frontend/package.json` version: 0.2.0 → 0.6.0
- Updated `backend/package.json` version: added 0.6.0
- Renamed `ROADMAP_OCTOBER_8_2025.md` → `ROADMAP.md`
- Added version display to app UI header (line 1602 in App.js)

---

### v0.5.0 - "Connection Enhancement" (Oct 8, 2025)
**Status:** ✅ Released

**Focus:** Edge label editing and connection management

**Features:**
- ✅ Right-click context menu for edges
- ✅ Edge label editing modal
- ✅ Delete connection option
- ✅ Beautiful animated context menu
- ✅ Clean D3 edge handling

**Bug Fixes:**
- Fixed modal not closing (AnimatePresence structure)
- Fixed modal opening on every right-click (state cleanup)
- Fixed modal not opening at all (early return + setTimeout issues)

**Technical:**
- EdgeContextMenu.js (197 lines)
- EdgeLabelModalSimple.js (117 lines)
- Enhanced D3Graph.js with context menu support

---

### v0.4.0 - "Dark Theme & Polish" (Oct 6-7, 2025)
**Status:** ✅ Released

**Focus:** Consistent dark theme and modal enhancements

**Features:**
- ✅ Full dark theme conversion for all modals
- ✅ Tab accent colors matching node types
- ✅ Connected nodes "Related" tab
- ✅ Notes & Tags system with rich text editor
- ✅ Tag color coding by node type
- ✅ Removed EnhancedEditingForm (too complex)

**Modals Enhanced:**
- CaseModal with psychiatric case fields
- TopicModal with learning progress
- TaskModal with basic management
- LiteratureModal with PDF upload

**Technical:**
- TipTap rich text editor integration
- Tag management system
- Consistent styling across all modals

---

### v0.3.0 - "Quick Wins" (Oct 6, 2025)
**Status:** ✅ Released

**Focus:** UI improvements and cleanup

**Features:**
- ✅ Search bar with real-time filtering
- ✅ Search highlighting (golden glow)
- ✅ Category filter badges with counts
- ✅ Edge labels rendering
- ✅ Template system removal
- ✅ CSV export removal
- ✅ "Made with Emergent" badge removal

**Changes:**
- Net -100 lines (cleanup!)
- Improved performance
- Cleaner UI

---

### v0.2.0 - "Core Features" (Sept-Oct 2025)
**Status:** ✅ Released

**Focus:** Building fundamental mind mapping capabilities

**Features:**
- ✅ D3.js force-directed graph
- ✅ 4 node types (Topic, Case, Task, Literature)
- ✅ Drag-to-connect relationships
- ✅ Node dragging and positioning
- ✅ Auto-save with debounce (800ms)
- ✅ LocalStorage caching
- ✅ Backend sync (FastAPI/Express)
- ✅ Keyboard shortcuts
- ✅ Category filtering
- ✅ Connection mode

**Technical:**
- React 19.0.0
- D3.js v7 for visualization
- Framer Motion for animations
- Tailwind CSS for styling

---

### v0.1.0 - "Foundation" (Early Sept 2025)
**Status:** ✅ Released

**Focus:** Initial project setup

**Features:**
- ✅ React app with Create React App
- ✅ Basic node creation
- ✅ Simple modals
- ✅ Backend server setup (dual FastAPI/Express)
- ✅ JSON file storage
- ✅ Basic UI structure

---

## Upcoming Versions (Roadmap)

### v0.7.0 - "Literature Integration" (Planned)
**Estimated:** 1-2 weeks

**Features:**
- [ ] In-app PDF viewer
- [ ] Citation export (APA/MLA/Chicago)
- [ ] DOI auto-fill from CrossRef API
- [ ] Highlight and annotate PDFs

---

### v0.8.0 - "Pattern Discovery" (Planned)
**Estimated:** 2-3 weeks

**Features:**
- [ ] Topic dashboard with analytics
- [ ] Pattern detection across cases
- [ ] Tag clustering visualization
- [ ] Most-connected nodes analysis

---

### v0.9.0 - "Quick-Link Workflow" (Planned)
**Estimated:** 1-2 weeks

**Features:**
- [ ] Enhanced node context menu
- [ ] "Connect to..." quick action
- [ ] Smart connection suggestions
- [ ] Connection type selection

---

### v1.0.0 - "Production Ready" (Goal)
**Estimated:** 1-2 months

**Features:**
- [ ] Complete visual organization system
- [ ] Full literature integration
- [ ] Pattern discovery tools
- [ ] Export capabilities (PNG/PDF)
- [ ] Onboarding tutorial
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Mobile responsiveness
- [ ] Comprehensive documentation

---

## Version Milestones

- **v0.1-0.3**: Foundation & Core Features (Sept-Oct 6)
- **v0.4-0.5**: Polish & Enhancement (Oct 6-8)
- **v0.6**: Visual Organization (Oct 8+) ← **Current**
- **v0.7-0.9**: Advanced Features (Oct-Nov)
- **v1.0**: Production Release (Goal: End of Oct/Early Nov)

---

## How to Update Version

When releasing a new version:

1. Update this VERSION.md file
2. Update package.json version
3. Tag the git commit: `git tag v0.X.X`
4. Update README.md if needed
5. Create release notes in docs/archive/

---

## Current Status Summary

**What's Working:** 
- Core mind mapping with 4 node types
- Rich modals with notes & tags
- Connection system with edge labels
- Dark theme throughout
- Auto-save and data persistence

**In Progress:**
- Focus mode for visual clarity
- Smart layout algorithm

**Next Up:**
- Literature PDF viewer
- Pattern discovery tools
- Quick-link workflow enhancements
