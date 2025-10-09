# PGY3-HUB Version History

**Current Version:** v0.6.0  
**Last Updated:** October 8, 2025

---

## Version Numbering System

**Format:** `v[MAJOR].[MINOR].[PATCH]`

- **MAJOR** (0.x.x): Complete overhauls, architecture changes, or major feature sets
- **MINOR** (x.X.x): New features, significant enhancements
- **PATCH** (x.x.X): Bug fixes, small improvements, polish

---

## Release History

### v0.6.0 - "Visual Clarity" (Oct 8, 2025) - CURRENT
**Status:** 🚧 In Development

**Focus:** Visual organization and connection clarity

**Planned Features:**
- [ ] Focus Mode (click node → radial web view)
- [ ] Smart Layout Algorithm (fix realign button)
- [ ] Enhanced visual hierarchy
- [ ] Pattern discovery through visualization

**Changes:**
- [x] Vision clarification: Visual thinking tool (not task manager)
- [x] Reprioritized roadmap based on core purpose
- [x] Documentation reorganization (cleaned up 40+ MD files → organized structure)
- [x] Version system established (v[MAJOR].[MINOR].[PATCH])
- [x] AI guidelines created for consistent documentation practices
- [ ] Focus Mode implementation (in progress)

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
