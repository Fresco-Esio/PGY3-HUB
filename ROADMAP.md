# PGY3-HUB Development Roadmap
**Updated:** October 8, 2025 (Evening - Post Edge Label Completion)  
**Status:** Phase 5 Complete - Refocusing on Core Vision

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

### Recent Accomplishments (Oct 6-8, 2025)

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

**Total Time Investment:** ~12-15 hours  
**Lines Added:** ~2,500  
**Lines Removed:** ~800  
**Net:** +1,700 lines of production code

---

## 🔄 Vision Realignment (Oct 8, Evening)

After clarifying the core purpose, we've identified the **real** priorities:

### What Matters for the Core Vision ✅
1. **Visual organization** - Seeing connections clearly
2. **Knowledge triangle** - Cases ↔ Topics ↔ Literature
3. **Clinical reflection** - Private notes and insights
4. **Pattern discovery** - Understanding across cases
5. **Calm, focused experience** - No notifications, no urgency

### What Doesn't Fit ❌
1. **Task system with deadlines** - This isn't a productivity app
2. **Notifications and reminders** - Breaks the calm studio vibe
3. **Gamification or urgency** - Counter to the vision

---

## 🎯 Current State Analysis

### What's Working Well ✅

1. **Mind Map Visualization**
   - D3.js force-directed graph
   - Smooth animations and transitions
   - Node dragging and positioning
   - Connection creation via drag
   - Edge labels with right-click editing

2. **Node Management**
   - 4 node types: Topic, Case, Task, Literature
   - Specialized modals for each type
   - Rich text notes
   - Tag system
   - Connected nodes viewing

3. **UI/UX**
   - Consistent dark theme
   - Beautiful animations (Framer Motion)
   - Responsive design
   - Keyboard shortcuts
   - Category filtering

4. **Data Persistence**
   - Auto-save (800ms debounce)
   - LocalStorage caching
   - Backend sync (FastAPI/Express)
   - JSON file storage

### What Needs Work ⚠️

1. **Task System**
   - ❌ No due date reminders/notifications
   - ❌ No task completion workflow (checkboxes)
   - ❌ No visual indicators for overdue tasks
   - ❌ No task status filtering
   - ⚠️ Basic task creation works, but limited features

2. **Literature Management**
   - ❌ No in-app PDF viewer
   - ❌ No citation export (APA, MLA, Chicago)
   - ❌ No DOI auto-fill
   - ⚠️ PDF upload works, but no viewer
   - ⚠️ Basic metadata only

3. **Search & Discovery**
   - ❌ No search results panel/list
   - ❌ No search history
   - ❌ No advanced search filters
   - ⚠️ Basic real-time filtering works

4. **Connection Management**
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

## 🚀 Phase 6: Visual Organization & Connection Clarity (CURRENT FOCUS)

**User Need:** "Being able to visually see the connected cases at once. Nodes should web out and branch in a way that is easy to see and not cluttered."

### Priority A: Focus Mode (HIGH PRIORITY) ⭐⭐⭐
**Effort:** 2-3 hours  
**Business Value:** HIGH - Core to visual thinking workflow  
**Status:** 🔴 NOT STARTED

**What It Does:**
- Click any node (especially Topic) → enter focus mode
- Selected node stays centered
- Connected nodes arrange in radial/web pattern around it
- Unconnected nodes fade to 10% opacity
- Smooth animated transitions
- Press ESC or click background to exit

**Features to Implement:**
1. **Focus Mode Activation**
   - [ ] Click handler for all nodes
   - [ ] Calculate 1st-degree connected nodes
   - [ ] Detect connection types and relationships
   - [ ] Enter focus mode animation

2. **Radial Layout Algorithm**
   - [ ] Position selected node at center
   - [ ] Arrange connected nodes in circle/web pattern
   - [ ] Calculate optimal spacing based on node count
   - [ ] Smooth animated repositioning

3. **Visual Hierarchy**
   - [ ] Selected node: 1.2x scale, bright glow
   - [ ] Connected nodes: Normal size, highlighted
   - [ ] Connection edges: Thicker, brighter
   - [ ] Unconnected nodes: 0.1 opacity, no interaction

4. **Exit Mechanism**
   - [ ] ESC key to exit
   - [ ] Click background to exit
   - [ ] Animate back to previous layout
   - [ ] Restore all node opacities

**Why This Matters:**
- **Directly addresses user need** for visual clarity
- Makes the "knowledge triangle" (Case-Topic-Literature) visible
- Enables pattern discovery across connected nodes
- Supports clinical reflection workflow

---

### Priority B: Smart Layout Algorithm (HIGH PRIORITY) ⭐⭐
**Effort:** 1-2 hours  
**Business Value:** HIGH - Fixes broken realign button  
**Status:** 🔴 NOT STARTED

**What It Does:**
- Fix the current "Realign Nodes" button to actually work well
- Detect node clusters (groups of connected nodes)
- Arrange clusters intelligently with clear separation
- Topics act as cluster centers with cases/literature orbiting

**Features to Implement:**
1. **Cluster Detection**
   - [ ] Identify connected components in graph
   - [ ] Detect Topic nodes as cluster centers
   - [ ] Group Cases/Literature by their primary Topic connection
   - [ ] Handle orphaned nodes (no connections)

2. **Hierarchical Layout**
   - [ ] Topics positioned as cluster centers
   - [ ] Cases arrange around their primary topic
   - [ ] Literature nodes connect to relevant cases/topics
   - [ ] Maintain clear visual separation between clusters

3. **Enhanced Force Simulation**
   - [ ] Clustering force (pull connected nodes together)
   - [ ] Separation force (push clusters apart)
   - [ ] Collision detection (prevent overlap)
   - [ ] Optimize force parameters for clarity

4. **Realign Button Integration**
   - [ ] Fix current implementation
   - [ ] Apply smart layout algorithm
   - [ ] Smooth animation during realignment
   - [ ] Toast feedback for user

**Why This Matters:**
- Current realign button doesn't work well
- Default layout is cluttered and confusing
- Intelligent clustering matches mental model
- Reduces need for manual node positioning

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
