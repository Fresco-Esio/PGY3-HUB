# PGY3-HUB Development Roadmap
**Updated:** November 24, 2025 (Connection-Aware Realignment Complete)  
**Last Major Update:** November 24, 2025 (Smart Layout Algorithm - Connection-Aware Enhancement)  
**Status:** Phase 7 Complete - Smart Layout & Connection-Aware Realignment ✅

---

## 🎯 Core Vision Clarification

**PGY3-HUB is a visual thinking tool for clinicians** to:
- Organize psychiatric knowledge through interconnected nodes
- Connect theory (Topics) to practice (Cases) to research (Literature)
- Document private clinical reflections outside the medical chart
- Study for boards using real case examples
- Create a "calm, focused digital studio for the mind"

**NOT a task management or productivity app.**

---

## 📊 Progress Summary

### Recent Accomplishments (Oct 6-17, 2025)

**Phase 1: Quick Wins & UI Polish** ✅ COMPLETE
- Search Bar with real-time filtering
- Category filter badges with counts
- Connection/Edge labels rendering
- Template System removal
- CSV Export removal
- "Made with Emergent" badge removal

**Phase 2: Modal System Overhaul** ✅ COMPLETE
- Full dark theme conversion for all modals
- Tab accent colors matching node types
- Consistent styling across CaseModal, TopicModal, TaskModal, LiteratureModal
- Removed EnhancedEditingForm (too complex)
- Specialized modal approach for each node type

**Phase 3: Notes & Tags System** ✅ COMPLETE
- Rich text editor integration (TipTap)
- Tag creation and management
- Tag color coding by node type
- Tag persistence to backend
- Notes tab in all modals

**Phase 4: Connected Nodes Tab** ✅ COMPLETE
- "Related" tab shows connected nodes
- Node type badges with colors
- Click to navigate to connected nodes
- Empty state handling

**Phase 5: Edge Label Editing** ✅ COMPLETE (Oct 8, Evening)
- Right-click context menu for edges
- Beautiful animated menu with gradient icons
- Edit label inline modal
- Delete connection option
- Clean state management with proper D3 edge handling

**Phase 5.5: Physics Controls** ✅ COMPLETE (Oct 14, 2025)
- Live adjustable physics parameters (collision, link, simulation dynamics)
- Real-time slider controls with 6 parameters
- Settings persistence via localStorage
- Save/Reset functionality with visual feedback
- Fixed state reset bug with useRef pattern
- Auto-loads saved settings on app start
- No backend required - browser storage only

**Phase 7: Smart Layout & Connection-Aware Realignment** ✅ COMPLETE (Nov 23-24, 2025)
- Cluster Detection with BFS algorithm
- Hierarchical layout system (Topics center, Tasks outer)
- Smart Realign button implementation
- **Connection-Aware Force Layout** ✨ NEW (Nov 24)
- **Always-On Simulation Architecture** ✨ NEW (Nov 24)
- **Drag Behavior Improvements** ✨ NEW (Nov 24)
- **Stability & Anti-Jitter Guards** ✨ NEW (Nov 24)

**Total Time Investment:** ~30-35 hours  
- **Localized Physics System**
  - Separate D3.js simulation for focused cluster only
  - Multi-level spreading using BFS (entire connected component)
  - Freezes unconnected nodes (no drift or movement)
  - Dramatic force parameters for visual clarity
  - Smooth UI-like animation with tuned damping
  
- **Smart Camera System**
  - Auto-centers and zooms to fit focused cluster
  - Saves camera position before entering Focus Mode
  - Restores previous view on exit (not fixed default)
  - Smooth 900ms transitions with bounding box calculation
  
- **Visual Hierarchy**
  - Focused node: 1.2x scale, bright blue glow
  - Connected nodes: Full opacity, subtle white glow
  - Unconnected nodes: 20% opacity, dimmed
  - Connected edges: Thicker (3px), brighter colors
  - Unconnected edges: Thin (1.5px), 10% opacity
  
- **Implementation Details**
  - Test page prototyping (`cluster-test.html`)
  - Iterative physics parameter tuning
  - D3 zoom behavior integration
  - Performance optimizations for large graphs
  - Clean separation of visual and physics systems

**Total Time Investment:** ~25-30 hours  
**Lines Added:** ~4,500  
**Lines Removed:** ~1,200  
**Net:** +3,300 lines of production code

---

## 🔄 Vision Realignment (Oct 8, Evening)

After clarifying the core purpose, we've identified the **real** priorities:

### What Matters for the Core Vision ✅
1. **Visual organization** - Seeing connections clearly ✅ (Focus Mode complete)
2. **Knowledge triangle** - Cases ↔ Topics ↔ Literature ✅ (Working well)
3. **Clinical reflection** - Private notes and insights ✅ (Notes system complete)
4. **Pattern discovery** - Understanding across cases ✅ (Focus Mode enables this)
5. **Calm, focused experience** - No notifications, no urgency ✅ (Philosophy maintained)

### What Doesn't Fit ❌
1. **Task system with deadlines** - This isn't a productivity app
2. **Notifications and reminders** - Breaks the calm studio vibe
3. **Gamification or urgency** - Counter to the vision

---

## 🎯 Current State Analysis

### What's Working Well ✅

1. **Mind Map Visualization**
   - D3.js force-directed graph with dual simulation architecture
   - Smooth animations and transitions
   - Node dragging and positioning
   - Connection creation via drag
   - Edge labels with right-click editing
   - **Focus Mode with localized physics** ✨ NEW
   - **Smart camera centering and zoom** ✨ NEW

2. **Node Management**
   - 4 node types: Topic, Case, Task, Literature
   - Specialized modals for each type
   - Rich text notes
   - Tag system
   - Connected nodes viewing

3. **UI/UX**
   - Consistent dark theme
   - Beautiful animations (Framer Motion, GSAP)
   - Responsive design
   - Keyboard shortcuts
   - Category filtering
   - **Live physics controls** ✨ NEW
   - **Visual hierarchy in Focus Mode** ✨ NEW

4. **Data Persistence**
   - Auto-save (800ms debounce)
   - LocalStorage caching
   - Backend sync (FastAPI/Express)
   - JSON file storage
   - **Physics settings persistence** ✨ NEW

### What Needs Work ⚠️

1. **Task System** (Low Priority - doesn't fit core vision)
   - ❌ No due date reminders/notifications
   - ❌ No task completion workflow (checkboxes)
   - ❌ No visual indicators for overdue tasks
   - ❌ No task status filtering
   - ⚠️ Basic task creation works, but limited features

2. **Literature Management** (Medium Priority)
   - ❌ No in-app PDF viewer
   - ❌ No citation export (APA, MLA, Chicago)
   - ❌ No DOI auto-fill
   - ⚠️ PDF upload works, but no viewer
   - ⚠️ Basic metadata only

3. **Search & Discovery** (Medium Priority)
   - ❌ No search results panel/list
   - ❌ No search history
   - ❌ No advanced search filters
   - ⚠️ Basic real-time filtering works

4. **Connection Management** (Low Priority)
   - ❌ No bulk connection operations
   - ❌ No connection filtering by type
   - ❌ No connection statistics
   - ⚠️ Basic creation/deletion works

5. **User Experience**
   - ❌ No onboarding tutorial
   - ❌ Limited keyboard navigation
   - ❌ No undo/redo functionality
   - ❌ No export options (PDF, PNG, etc.)

6. **Technical Debt**
   - ❌ Limited error boundaries
   - ❌ No loading skeleton screens
   - ❌ Accessibility gaps (ARIA labels)
   - ❌ Mobile responsiveness not optimized

---

## 🚀 Phase 7: Smart Layout & Connection-Aware Realignment (COMPLETE - Nov 24, 2025)

**Status:** ✅ COMPLETE - Both hierarchical layout AND connection awareness implemented

### ✅ Priority B: Smart Layout Algorithm (COMPLETE - Nov 23-24, 2025) ⭐⭐
**Effort:** 8-10 hours (Actual: ~10 hours)  
**Business Value:** HIGH - Makes realignment actually useful  
**Status:** ✅ COMPLETE with Connection-Aware Enhancement

**What Was Implemented:**

**Day 1 (Nov 23): Hierarchical Cluster Detection**
- [x] BFS-based cluster detection algorithm
- [x] Topics identified as cluster centers
- [x] Hierarchical positioning (Topics center, Cases/Literature middle, Tasks outer)
- [x] Circular arrangement with 400px cluster separation
- [x] Fixed "Realign Nodes" button to use intelligent clustering
- [x] Toast feedback showing cluster count

**Day 2 (Nov 24): Connection-Aware Enhancement** ✨
- [x] **Always-On Simulation Architecture**
  - Eliminated stop/start conflicts
  - Single continuous simulation with dynamic force modification
  - Instant response (no waiting for simulation to stop)
  - Temporary radial force, automatically removed when settled

- [x] **Connection-Aware Force Parameters**
  - Stronger link force (0.8 strength) clusters connected nodes
  - Shorter link distance (120px) keeps related nodes close
  - Reduced repulsion (-300 charge) allows tighter grouping
  - Smaller collision radius (20px) for compact clusters

- [x] **Hybrid Hierarchical + Connection Layout**
  - Radial force positions by node type (Topics center → Tasks outer)
  - Link force keeps connected nodes together within layers
  - Best of both: organized by TYPE and RELATIONSHIPS

- [x] **Drag Behavior Fixes**
  - Reduced drag threshold (5px → 2px) for responsive clicking
  - Fixed node locking issues after realignment
  - Removed 1-second freeze period
  - Smooth drag without snap-back

- [x] **Stability & Anti-Jitter System**
  - Extended guard period (1 second) prevents position conflicts
  - Blocks mindMapData updates during realignment
  - Prevents D3Graph restart immediately after realignment
  - Eliminates visual jitter when dragging post-realignment

**Bug Fixes (Nov 24):**
- Fixed infinite loop (realignment triggering repeatedly)
- Fixed position revert after drag
- Fixed inability to drag nodes after realignment
- Fixed simulation restart causing jitter
- Fixed TypeError from undefined force properties
- Fixed nodes snapping back on first drag after realignment

**Technical Details:**
- Modified existing simulation instead of creating new ones
- One-time 'end' event listener with self-removal
- Guard flag `window.isCustomRealigning` with extended timeout
- Force parameter null checks for robustness
- Connection-aware parameters: link 0.8/120px, charge -300, collision 20px

**Files Modified:**
- `App.js` - Complete rewrite of `forceLayout()` function
  - Removed old cluster detection algorithm
  - Implemented always-on simulation modification approach
  - Added connection-aware force parameters
  - Extended guard timeouts for stability
- `D3Graph.js` - Fixed drag threshold, removed post-realignment locks

**User Experience:**
1. Click "Realign Nodes" anytime (instant response)
2. Nodes spread hierarchically (Topics center, Tasks outer)
3. Connected nodes cluster together for easy scanning
4. Smooth animation with auto camera framing
5. Immediately draggable when settled (no freeze)
6. Stable behavior, no jitter or position resets

**Why It Matters:**
- Realignment emphasizes RELATIONSHIPS not just hierarchy
- Connected nodes cluster = easy to see what's linked
- Stable, professional UX without confusion
- Always-responsive = feels fluid and intentional
- Supports "show me what's connected" visual thinking

---

## 🚀 Phase 8: Next Priorities (UPCOMING)

**Status:** Planning phase - Smart Layout complete, selecting next features

Based on the core vision and user needs, the following priorities are recommended:

### Recommended Next Steps:

1. **Priority C: Literature Enhancement** (MEDIUM PRIORITY) ⭐⭐
   - In-app PDF viewer integration
   - Citation export (APA, MLA, Chicago)
   - DOI auto-fill functionality
   - **Effort:** 3-4 hours | **Value:** Medium-High

2. **Priority D: Quick-Link Workflow** (MEDIUM PRIORITY) ⭐⭐
   - Right-click "Connect to..." menu
   - Smart connection suggestions
   - Improved drag-to-connect
   - **Effort:** 2-3 hours | **Value:** Medium

3. **Priority E: Pattern Discovery** (LOW PRIORITY) ⭐
   - Topic dashboard with connected cases
   - Tag co-occurrence analysis
   - Visual analytics
   - **Effort:** 2-3 hours | **Value:** Medium

See detailed specifications for each priority below.

---

## ✅ Phase 6: Visual Organization & Connection Clarity (COMPLETE - Oct 17, 2025)

**User Need:** "Being able to visually see the connected cases at once. Nodes should web out and branch in a way that is easy to see and not cluttered."

### ✅ Priority 0: Physics Controls (COMPLETE - Oct 14, 2025) ⭐⭐⭐
**Effort:** 3-4 hours (Actual: ~4 hours)  
**Business Value:** HIGH - Essential for customizing visual layout  
**Status:** ✅ COMPLETE

**What Was Implemented:**
- Live physics parameter controls (6 adjustable parameters)
- Real-time updates to D3.js force simulation
- Settings persistence via localStorage
- Save/Reset functionality with visual feedback
- Fixed state reset bug using useRef pattern
- Auto-loads saved settings on application start

**Technical Details:**
- Collision settings: radius (20-100), strength (0-1)
- Link settings: distance (50-200), strength (0-1)
- Simulation dynamics: alphaDecay (0.01-0.1), velocityDecay (0.1-0.9)
- Storage key: `pgy3hub_physics_settings`
- No backend required - browser localStorage only

**Files Modified:**
- `D3Graph.js` - Added localStorage loading and physicsParamsRef
- `PhysicsControls.js` - New component with Save/Reset functionality
- Documentation: `docs/features/PHYSICS_CONTROLS_FEATURE.md`

**User Experience:**
1. Click gear icon in top-right corner
2. Adjust sliders to find optimal settings
3. Click "Save Settings" to persist preferences
4. Settings automatically load on next visit
5. Click "Reset" to restore defaults

---

### ✅ Priority A: Advanced Focus Mode (COMPLETE - Oct 17, 2025) ⭐⭐⭐
**Effort:** 6-8 hours (Actual: ~8 hours)  
**Business Value:** HIGH - Core to visual thinking workflow  
**Status:** ✅ COMPLETE

**What Was Implemented:**

**Localized Physics System:**
- [x] Separate D3.js simulation for focused cluster only
- [x] Multi-level spreading using BFS algorithm (entire connected component)
- [x] Frozen unconnected nodes using D3's fx/fy (no drift)
- [x] Dramatic force parameters for visual clarity
- [x] Smooth UI-like animation with tuned damping

**Smart Camera System:**
- [x] Auto-centers and zooms to fit focused cluster
- [x] Saves camera position before entering Focus Mode
- [x] Restores previous view on exit (not fixed default)
- [x] Smooth 900ms transitions with bounding box calculation
- [x] D3 zoom behavior integration with transform persistence

**Visual Hierarchy:**
- [x] Focused node: 1.2x scale, bright blue glow (20px drop-shadow)
- [x] Connected nodes: Full opacity, subtle white glow (10px)
- [x] Unconnected nodes: 20% opacity, dimmed
- [x] Connected edges: Thicker (3px), brightened colors
- [x] Unconnected edges: Thin (1.5px), 10% opacity

**Implementation Details:**
- [x] Focus Mode toggle UI in toolbar
- [x] BFS algorithm for connected component detection
- [x] Dual simulation architecture (main + focus)
- [x] Test page prototyping (`cluster-test.html`)
- [x] Iterative physics parameter tuning
- [x] Performance optimizations for large graphs (100+ nodes)
- [x] Clean separation of visual and physics systems

**Files Modified:**
- `App.js` - BFS algorithm, Focus Mode state management
- `D3Graph.js` - Dual simulations, camera system, visual hierarchy
- `cluster-test.html` - Prototype/test page for rapid physics tuning
- Documentation: `docs/archive/FOCUS_MODE_COMPLETE.md`

**Why This Matters:**
- ✅ **Directly addresses user need** for visual clarity
- ✅ Makes the "knowledge triangle" (Case-Topic-Literature) visible
- ✅ Enables pattern discovery across connected nodes
- ✅ Supports clinical reflection workflow
- ✅ Preserves "calm, focused" philosophy with smooth animations

---

### ✅ Priority B: Smart Layout Algorithm (COMPLETE - Nov 23, 2025) ⭐⭐
**Effort:** 1-2 hours (Actual: ~1 hour)
**Business Value:** HIGH - Fixes broken realign button  
**Status:** ✅ COMPLETE

**What Was Implemented:**

1. **Cluster Detection** ✅
   - [x] Identify connected components in graph using BFS algorithm
   - [x] Detect Topic nodes as cluster centers
   - [x] Group Cases/Literature by their primary Topic connection
   - [x] Handle orphaned nodes (no connections)

2. **Hierarchical Layout** ✅
   - [x] Topics positioned as cluster centers in circular arrangement
   - [x] Cases/Literature arranged in orbit around their topic centers
   - [x] Clear visual separation between clusters (400px between centers)
   - [x] Orphaned nodes handled appropriately

3. **Enhanced Force Simulation** ✅
   - [x] Existing link forces pull connected nodes together (clustering)
   - [x] Spatial separation between clusters via initial positioning
   - [x] Collision detection prevents overlap
   - [x] Smooth animations during realignment

4. **Realign Button Integration** ✅
   - [x] Fixed current "Realign Nodes" button implementation
   - [x] Applied smart cluster detection algorithm
   - [x] Smooth animation during realignment
   - [x] Toast feedback showing number of clusters detected

**Implementation Details:**
- `detectClusters()` function in App.js (lines ~1230-1320)
- `forceLayout()` updated with hierarchical positioning (lines ~1323-1390)
- BFS algorithm for connected component detection
- Cluster centers determined by most-connected Topic node
- Circular layout with configurable cluster radius (400px) and orbit radius (150px)

**Why This Matters:**
- ✅ Current realign button now works intelligently
- ✅ Default layout is intelligible and organized
- ✅ Intelligent clustering matches mental model (Topic → Cases/Literature)
- ✅ Reduces need for manual node positioning

---

### Priority C: Literature Enhancement (MEDIUM PRIORITY) ⭐⭐
**Effort:** 3-4 hours  
**Business Value:** MEDIUM - Supports knowledge triangle  
**Status:** 🔴 NOT STARTED

**What It Does:**
- Read papers inside PGY3-HUB without leaving the app
- Highlight passages and link to cases
- Export formatted citations
- Auto-fill metadata from DOI

**Features to Implement:**
1. **PDF Viewer Integration**
   - [ ] Embed react-pdf library
   - [ ] View uploaded PDFs in LiteratureModal
   - [ ] Zoom, pan, navigate pages
   - [ ] Fullscreen mode

2. **Citation Management**
   - [ ] Format as APA style
   - [ ] Format as MLA style
   - [ ] Format as Chicago style
   - [ ] Copy to clipboard button

3. **DOI Auto-Fill**
   - [ ] DOI input field in modal
   - [ ] CrossRef API integration
   - [ ] Auto-populate: title, authors, journal, year
   - [ ] Error handling for invalid DOIs

4. **Annotation System** (Future)
   - [ ] Highlight text in PDFs
   - [ ] Add sticky notes to pages
   - [ ] Extract quotes to case notes
   - [ ] Link highlights to specific cases

**Why This Matters:**
- Keeps user in the "flow" of the app
- Supports Literature → Case connections
- Makes literature nodes fully functional
- Enables evidence-based clinical reflection

---

### Priority D: Quick-Link Workflow (MEDIUM PRIORITY) ⭐⭐
**Effort:** 2-3 hours  
**Business Value:** MEDIUM - Makes connections effortless  
**Status:** 🔴 NOT STARTED

**What It Does:**
- Right-click node → "Connect to..." → filtered selector
- Auto-suggest relevant topics when creating cases
- Make the core connection workflow effortless

**Features to Implement:**
1. **Enhanced Context Menu**
   - [ ] Add "Connect to..." option in node context menu
   - [ ] Open filterable node selector modal
   - [ ] Show only valid connection targets
   - [ ] Preview connection before creating

2. **Connection Type Selector**
   - [ ] Select type: "exemplifies", "supports", "relates to", etc.
   - [ ] Add label inline
   - [ ] Visual feedback during selection

3. **Smart Suggestions**
   - [ ] When creating Case: suggest relevant Topics based on tags
   - [ ] When creating Literature: suggest Cases/Topics
   - [ ] Use NLP or keyword matching for suggestions

4. **Drag-to-Connect Enhancement**
   - [ ] Show connection preview while dragging
   - [ ] Snap to valid targets
   - [ ] Better visual feedback

**Why This Matters:**
- Current connection workflow requires entering connection mode
- Makes building the "knowledge triangle" faster
- Reduces friction in core workflow
- Supports spontaneous connection-making

---

### Priority E: Pattern Discovery & Topic Dashboard (LOW PRIORITY) ⭐
**Effort:** 2-3 hours  
**Business Value:** MEDIUM - Enables insights  
**Status:** 🔴 NOT STARTED

**What It Does:**
- Click topic → see dashboard of all connected cases
- Pattern analysis across cases
- Most-referenced literature
- Tag co-occurrence

**Features to Implement:**
1. **Topic Dashboard Component**
   - [ ] Side panel or modal view
   - [ ] List all connected cases
   - [ ] List connected literature
   - [ ] Show connection count

2. **Pattern Analysis**
   - [ ] Extract common tags across cases
   - [ ] Identify recurring defense mechanisms
   - [ ] Show treatment approaches used
   - [ ] Highlight patterns in notes

3. **Visual Analytics**
   - [ ] Tag cloud of common tags
   - [ ] Timeline of case creation
   - [ ] Most-cited literature
   - [ ] Connection density

**Why This Matters:**
- Supports clinical learning and insight
- Helps identify patterns across patients
- Makes studying for boards more effective
- Enables evidence-based reflection

---

### Priority F: Task Node Rethinking (LOW PRIORITY) ⭐
**Effort:** 1-2 hours  
**Business Value:** LOW - Cleanup  
**Status:** 🔴 NOT STARTED

**What It Does:**
- Determine if Task nodes fit the vision
- Either remove them, rename them, or repurpose them

**Options:**
1. **Option 1: Remove Entirely**
   - [ ] Delete Task node type
   - [ ] Simplify to 3 node types: Case, Topic, Literature
   - [ ] Focus on core knowledge triangle

2. **Option 2: Rename to "Clinical Questions"**
   - [ ] Use for open clinical questions
   - [ ] "Why isn't this patient responding?"
   - [ ] Link to cases that might inform answer

3. **Option 3: Rename to "Reflections"**
   - [ ] Use for clinical insights
   - [ ] "Pattern noticed: BPD patients often..."
   - [ ] Link to supporting cases

**Why This Matters:**
- Tasks with deadlines don't fit "calm studio" vision
- Clarifies the purpose of each node type
- May simplify or enhance the model

---

### Priority G: "Calm Studio" Aesthetic Polish (ONGOING)
**Effort:** Ongoing  
**Business Value:** LOW - Incremental  
**Status:** 🟢 CONTINUOUS

**What It Does:**
- Enhance the "calm, focused digital studio" vibe
- No notifications, no urgency, beautiful design

**Features to Implement:**
1. **Ambient Animations**
   - [ ] Subtle particle effects in background
   - [ ] Gentle breathing motion on nodes
   - [ ] Smooth, organic transitions

2. **Focus Mode** (Visual)
   - [ ] Dim everything except current work
   - [ ] Spotlight effect on active node
   - [ ] Reduced visual noise

3. **Sound Design** (Optional)
   - [ ] Ambient background music toggle
   - [ ] Nature sounds (rain, waves, etc.)
   - [ ] Subtle interaction sounds

4. **Layout & Spacing**
   - [ ] More whitespace
   - [ ] Better visual hierarchy
   - [ ] Zen-like minimalism

**Why This Matters:**
- Matches the core vision
- Creates calm, focused experience
- Differentiates from productivity apps
- Supports deep clinical reflection

---

## 📋 Recommended Priority Order (UPDATED)

Based on core vision alignment and user needs:

1. **🥇 Focus Mode** (Priority A)
   - **Why First:** Directly addresses user's stated need for visual clarity
   - **Impact:** HIGH - Core to visual thinking workflow
   - **Effort:** 2-3 hours
   - **Dependencies:** None
   - **Aligns with vision:** ✅ Visual organization, calm studio

2. **🥈 Smart Layout Algorithm** (Priority B)
   - **Why Second:** Fixes broken realign button, improves default view
   - **Impact:** HIGH - Makes graph intelligible by default
   - **Effort:** 1-2 hours
   - **Dependencies:** None (complements Focus Mode)
   - **Aligns with vision:** ✅ Visual clarity, reduced clutter

3. **� Literature Enhancement** (Priority C)
   - **Why Third:** Completes the knowledge triangle
   - **Impact:** MEDIUM - Enables in-app reading workflow
   - **Effort:** 3-4 hours
   - **Dependencies:** None
   - **Aligns with vision:** ✅ Literature → Case connections

4. **Quick-Link Workflow** (Priority D)
   - **Why Fourth:** Makes connection creation effortless
   - **Impact:** MEDIUM - Improves core workflow
   - **Effort:** 2-3 hours
   - **Dependencies:** None
   - **Aligns with vision:** ✅ Knowledge triangle ease of use

5. **Pattern Discovery** (Priority E)
   - **Why Fifth:** Enables clinical insights
   - **Impact:** MEDIUM - Supports learning and reflection
   - **Effort:** 2-3 hours
   - **Dependencies:** Focus Mode helps, not required
   - **Aligns with vision:** ✅ Clinical reflection, board studying

6. **Task Rethinking** (Priority F)
   - **Why Sixth:** Cleanup, not critical
   - **Impact:** LOW - Clarifies model
   - **Effort:** 1-2 hours
   - **Dependencies:** None
   - **Aligns with vision:** ⚠️ May not fit vision at all

7. **Calm Studio Polish** (Priority G)
   - **Why Ongoing:** Continuous refinement
   - **Impact:** LOW - Incremental improvements
   - **Effort:** Ongoing
   - **Dependencies:** Build features first, then polish
   - **Aligns with vision:** ✅ Core to "calm studio" experience

---

## 🎯 Success Metrics

### Task System Success Criteria
- [ ] Can create task with due date
- [ ] Can mark task as complete
- [ ] Overdue tasks show red indicator
- [ ] Toast notification appears for due tasks
- [ ] Can filter tasks by status
- [ ] Can link task to case
- [ ] Task completion rate tracked

### Literature Success Criteria
- [ ] Can view PDF in modal
- [ ] Can export citation in 3 formats
- [ ] DOI auto-fill works for 90%+ of papers
- [ ] Can add annotations to PDFs
- [ ] Annotations persist across sessions

### Search Success Criteria
- [ ] Search results panel shows matches
- [ ] Can click result to navigate
- [ ] Advanced filters work correctly
- [ ] Search completes in <100ms
- [ ] Recent searches persist

---

## 💡 Alternative Approaches

### If Time is Limited
**Quick Wins Approach:**
- Focus on task completion checkbox (30 min)
- Add due date indicator (30 min)
- PDF viewer basic integration (1 hour)
- Search results panel (1 hour)
**Total:** 3 hours of high-impact features

### If You Want Maximum Impact
**User-Centered Approach:**
- Interview a resident about workflow
- Identify pain points
- Build features that solve real problems
- Iterate based on feedback

### If You Want Technical Excellence
**Polish & Refactor:**
- Add comprehensive error handling
- Improve test coverage
- Optimize performance
- Document all components
- Create design system

---

## 🔧 Technical Considerations

### Current Tech Stack
- **Frontend:** React 19, D3.js, Framer Motion, TipTap, Tailwind CSS
- **Backend:** FastAPI (Python) OR Express.js (Node.js)
- **Storage:** Local JSON files, LocalStorage caching
- **Build:** CRACO, Create React App

### For Task System
- Need date/time library: `date-fns` or `dayjs`
- Need notification system: `react-toastify` (already have Framer Motion)
- Need calendar component: `react-datepicker` or build custom

### For Literature
- Need PDF viewer: `react-pdf` or `@react-pdf-viewer/core`
- Need API client: `axios` (already have)
- CrossRef API: Free, no key needed

### For Search
- Need fuzzy search: `fuse.js` or keep current approach
- Need highlighting: Already implemented
- Need result ranking: Implement scoring algorithm

---

## 📝 Implementation Notes

### Task System - Detailed Plan

**Step 1: Data Model Updates**
```javascript
// Add to Task type
{
  id: number,
  label: string,
  description: string,
  dueDate: string | null,        // NEW: ISO 8601 date string
  status: 'todo' | 'in-progress' | 'done' | 'blocked',  // NEW
  priority: 'low' | 'medium' | 'high' | 'urgent',       // NEW
  completedAt: string | null,    // NEW: Timestamp
  linkedCaseId: number | null,   // NEW: Link to case
  subtasks: Array<{              // NEW: Checklist
    id: number,
    label: string,
    completed: boolean
  }>,
  notes: string,                 // Already have
  tags: string[],                // Already have
  createdAt: string,
  updatedAt: string
}
```

**Step 2: TaskModal Enhancements**
- Add Due Date picker
- Add Status dropdown
- Add Priority selector
- Add Subtask checklist
- Add Case linking dropdown

**Step 3: Task Node Visual Updates**
- Show due date on node
- Color-code by priority
- Add completion checkbox overlay
- Show status badge

**Step 4: Notification System**
- Background check for due tasks
- Show toast notification
- Play sound (optional)
- Show count badge in app header

**Step 5: Backend Updates**
- Update task schema in `server.py` and `server.js`
- Add validation for new fields
- Ensure backward compatibility

---

### Literature Enhancement - Detailed Plan

**Step 1: PDF Viewer Integration**
```bash
npm install react-pdf pdfjs-dist
```

```javascript
// In LiteratureModal
import { Document, Page } from 'react-pdf';

const [numPages, setNumPages] = useState(null);
const [pageNumber, setPageNumber] = useState(1);

<Document
  file={`/api/uploads/${literature.pdfPath}`}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
>
  <Page pageNumber={pageNumber} />
</Document>
```

**Step 2: Citation Export**
```javascript
const formatCitation = (lit, style) => {
  switch(style) {
    case 'APA':
      return `${lit.authors.join(', ')} (${lit.year}). ${lit.title}. ${lit.journal}.`;
    case 'MLA':
      return `${lit.authors[0]} et al. "${lit.title}." ${lit.journal} (${lit.year}).`;
    case 'Chicago':
      return `${lit.authors.join(', ')}. "${lit.title}." ${lit.journal} (${lit.year}).`;
  }
};
```

**Step 3: DOI Auto-Fill**
```javascript
const fetchDOI = async (doi) => {
  const response = await axios.get(`https://api.crossref.org/works/${doi}`);
  const data = response.data.message;
  return {
    title: data.title[0],
    authors: data.author.map(a => `${a.given} ${a.family}`),
    journal: data['container-title'][0],
    year: data.published['date-parts'][0][0]
  };
};
```

---

## 🤔 Decision Time

### What Should We Build Next?

**I recommend starting with Option A: Task System Enhancement**

**Reasoning:**
1. **Highest business value** - Core to resident workflow
2. **Clear user need** - Task management is essential
3. **Builds on existing** - Task nodes already exist
4. **Manageable scope** - Can complete in one session
5. **Visible impact** - Users will immediately benefit

**Alternative: Quick Wins Combo**
If 4-6 hours feels like too much, we could do:
- Task completion checkbox (30 min)
- Due date display (30 min)  
- Basic PDF viewer (1 hour)
- Search results panel (1 hour)

**Total:** 3 hours, multiple features improved

---

## 🎨 Design Mockups Needed

Before implementing, we should sketch:
1. TaskModal with new fields
2. Task node with status/due date
3. Notification toast design
4. PDF viewer layout
5. Search results panel

Would you like me to provide ASCII mockups or should we dive into code?

---

## 📚 Resources

### Task System
- [date-fns Documentation](https://date-fns.org/)
- [React DatePicker](https://reactdatepicker.com/)
- [Framer Motion Notifications](https://www.framer.com/motion/)

### Literature
- [react-pdf GitHub](https://github.com/wojtekmaj/react-pdf)
- [CrossRef API Docs](https://api.crossref.org/)
- [Citation Styles](https://citationstyles.org/)

### Search
- [Fuse.js Documentation](https://fusejs.io/)
- [Search UI Patterns](https://ui-patterns.com/patterns/search)

---

## ✅ Next Steps

1. **Review this roadmap** and confirm priorities
2. **Choose one option** (A, B, C, D, or E)
3. **Break down into tasks** (if not already done)
4. **Create implementation plan** with step-by-step guide
5. **Start coding!** 🚀

**What would you like to tackle first?**
