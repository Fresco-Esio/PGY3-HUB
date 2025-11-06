# What's Left to Build - PGY3-HUB

**Last Updated:** October 8, 2025 (Evening - Post Vision Clarification)  
**Status:** Core features complete, refocusing on visual organization

---

## 🎯 Vision Update

**PGY3-HUB is a visual thinking tool** for clinicians to:
- Organize psychiatric knowledge through the "knowledge triangle" (Cases ↔ Topics ↔ Literature)
- Document private clinical reflections outside the medical chart
- Study for boards using real case examples
- Experience a "calm, focused digital studio for the mind"

**NOT a task management or productivity app.**

---

## 🎉 What's Already Working

### Mind Map Core ✅
- D3.js force-directed graph with smooth physics
- 4 node types: Topic, Case, Task, Literature
- Drag-to-connect relationship creation
- Node dragging and positioning
- Edge labels with right-click editing
- Auto-layout with force simulation
- Category filtering
- Real-time search with highlighting

### Modal System ✅
- CaseModal with psychiatric case fields
- TopicModal with learning progress tracking
- TaskModal with basic task management
- LiteratureModal with PDF upload
- Notes tab with rich text editor
- Tags tab with creation/management
- Related tab showing connected nodes
- Consistent dark theme styling

### Data Management ✅
- Auto-save with 800ms debounce
- LocalStorage caching for fast startup
- Backend sync (FastAPI/Express)
- JSON file persistence
- Connection tracking

### UI/UX ✅
- Beautiful dark theme
- Framer Motion animations
- Keyboard shortcuts
- Search bar with filtering
- Category badges
- Edge context menu

---

## 🚧 What Needs Building

### 1. Focus Mode (NEW - HIGHEST PRIORITY) ⭐⭐⭐
**Status:** Doesn't exist yet  
**User Need:** "Being able to visually see the connected cases at once. Nodes should web out and branch in a way that is easy to see and not cluttered."

**Missing:**
- ❌ Click node to enter focus mode
- ❌ Radial/web layout for connected nodes
- ❌ Fade unconnected nodes to 10% opacity
- ❌ Center selected node with animation
- ❌ ESC or click to exit focus mode
- ❌ Visual hierarchy (selected bright, connected normal, rest dimmed)

**Why This Matters:**
- Core to visual thinking workflow
- Makes connection patterns visible
- Supports clinical reflection
- Enables pattern discovery

---

### 2. Smart Layout Algorithm (NEW - HIGH PRIORITY) ⭐⭐
**Status:** Realign button exists but doesn't work well  
**User Need:** Fix realign to actually organize nodes intelligently

**Missing:**
- ❌ Cluster detection (groups of connected nodes)
- ❌ Hierarchical arrangement (Topics as centers)
- ❌ Enhanced force simulation with clustering
- ❌ Clear separation between distinct clusters
- ❌ Proper realign button implementation

**What Exists:**
- ✅ Basic force simulation
- ⚠️ Realign button (but doesn't work well)

**Why This Matters:**
- Fixes broken feature
- Default view should be intelligible
- Reduces manual positioning
- Complements focus mode

---

### 3. Literature Enhancement
**Status:** Upload works, but no viewer  
**Missing:**
- ❌ In-app PDF viewer
- ❌ Citation export (APA/MLA/Chicago)
- ❌ DOI auto-fill from CrossRef API
- ❌ PDF annotations
- ❌ Highlight/note system

**What Exists:**
- ✅ PDF upload
- ✅ Basic metadata (title, authors, year)
- ✅ Notes and tags

---

### 4. Quick-Link Workflow
**Status:** Basic connection mode exists  
**Missing:**
- ❌ Right-click node → "Connect to..." option
- ❌ Filterable node selector modal
- ❌ Connection type selector (exemplifies, supports, etc.)
- ❌ Auto-suggest topics when creating cases
- ❌ Better drag-to-connect visual feedback

**What Exists:**
- ✅ Drag-to-connect in connection mode
- ✅ Basic connection creation
- ✅ Edge label editing

**Why This Matters:**
- Makes knowledge triangle easy to build
- Reduces friction in core workflow
- Supports spontaneous connections

---

### 5. Pattern Discovery & Topic Dashboard
**Status:** Doesn't exist  
**Missing:**
- ❌ Click topic → see dashboard
- ❌ List all connected cases
- ❌ Pattern analysis (common tags, etc.)
- ❌ Most-referenced literature
- ❌ Tag co-occurrence visualization

**What Exists:**
- ✅ "Related" tab shows connected nodes
- ⚠️ No aggregated view or analytics

**Why This Matters:**
- Enables clinical insights
- Supports board studying
- Pattern recognition across cases

---

### 6. Task Node Rethinking
**Status:** Tasks exist but may not fit vision  
**Question:** Do tasks belong in a "calm studio" app?

**Options:**
1. Remove entirely (simplify to 3 node types)
2. Rename to "Clinical Questions"
3. Rename to "Reflections"

**What Exists:**
- ✅ Task creation
- ✅ Basic notes/tags
- ❌ No due dates (and shouldn't have them?)

---

### 7. Search & Discovery (Lower Priority)
**Status:** Basic search works  
**Missing:**
- ❌ Search results panel/list
- ❌ Advanced filters
- ❌ Search history

**What Exists:**
- ✅ Real-time filtering
- ✅ Highlight matching nodes

---

### 8. UX Polish
**Status:** Works but could be better  
**Missing:**
- ❌ Onboarding tutorial
- ❌ Loading skeleton screens
- ❌ Better error messages
- ❌ Undo/redo
- ❌ Export (PNG/PDF/JSON)
- ❌ Mobile responsiveness

**What Exists:**
- ✅ Loading spinner
- ✅ Basic error handling
- ✅ Keyboard shortcuts
- ✅ Auto-save indicator

---

### 9. "Calm Studio" Aesthetic
**Status:** Good foundation, can be enhanced  
**Missing:**
- ❌ Ambient animations (particles, breathing motion)
- ❌ Focus mode lighting (dim everything else)
- ❌ Optional sound design (ambient music/nature)
- ❌ More whitespace and zen layout

**What Exists:**
- ✅ Dark theme
- ✅ Smooth animations
- ✅ Clean design

---

## 📊 Priority Matrix (UPDATED)

| Feature | Vision Fit | Effort | Priority | Next? |
|---------|-----------|--------|----------|-------|
| Focus Mode | ⭐⭐⭐ Perfect | 2-3h | 🔴 Critical | ⭐ YES |
| Smart Layout | ⭐⭐⭐ Perfect | 1-2h | 🔴 Critical | ⭐ YES |
| Literature | ⭐⭐ Good | 3-4h | 🟡 Important | Later |
| Quick-Link | ⭐⭐ Good | 2-3h | 🟡 Important | Later |
| Pattern Discovery | ⭐⭐ Good | 2-3h | � Important | Later |
| Task Rethink | ⚠️ Unclear | 1-2h | 🟢 Cleanup | Later |
| Search Panel | ⭐ Neutral | 2-3h | 🟢 Nice | Later |
| UX Polish | ⭐⭐⭐ Perfect | Ongoing | 🟢 Continuous | Always |

---

## 🎯 Immediate Next Steps (UPDATED)

### Option 1: Focus Mode + Smart Layout (RECOMMENDED) ⭐⭐⭐
**Time:** 3-4 hours total  
**Impact:** HIGH - Directly addresses user need for visual clarity

**Order:**
1. **Build Focus Mode first** (2-3h)
   - Click node to enter focus mode
   - Radial layout for connected nodes
   - Fade unconnected nodes
   - ESC to exit

2. **Then Smart Layout** (1-2h)
   - Fix realign button
   - Cluster detection
   - Hierarchical arrangement
   - Enhanced force simulation

**Deliverables:**
- Click any node to see its connection web clearly
- Intelligent default layout that isn't cluttered
- Fixed realign button
- Complete visual organization solution

**Why This First:**
- User explicitly asked for this
- Core to visual thinking workflow
- Matches the "calm studio" vision
- High impact, reasonable effort

---

### Option 2: Focus Mode Only
**Time:** 2-3 hours  
**Impact:** HIGH - Most impactful single feature

**Tasks:**
1. Focus mode activation (click handler)
2. Radial layout algorithm
3. Visual hierarchy (fade/brighten)
4. Exit mechanism (ESC/click)

**Deliverables:**
- Click topic → see connection web
- Beautiful visual clarity
- Pattern discovery enabled

---

### Option 3: Literature Enhancement
**Time:** 3-4 hours  
**Impact:** MEDIUM - Completes knowledge triangle

**Tasks:**
1. Integrate react-pdf (1h)
2. Build PDF viewer in modal (1h)
3. Citation formatter (1h)
4. DOI auto-fill (1-2h optional)

**Deliverables:**
- Read PDFs in-app
- Export formatted citations
- Seamless literature workflow

---

## 💡 Recommended Path Forward (UPDATED)

**I strongly recommend Option 1: Focus Mode + Smart Layout**

### Why?
1. **User explicitly asked for this** - "Being able to visually see the connected cases at once"
2. **Core to vision** - Visual thinking and knowledge organization
3. **High impact** - Makes the entire app more usable
4. **Fixes broken feature** - Realign button currently doesn't work well
5. **Enables everything else** - Better visualization helps all other features

### What You'll Get:
- Click any node → see its connection web clearly
- Intelligent auto-layout (realign works properly)
- Pattern discovery across connected nodes
- Visual clarity for clinical reflection
- "Calm studio" aesthetic with focus mode

### User Story:
> "As a psychiatrist, I want to click on a topic like 'Major Depressive Disorder' and instantly see all my cases that exemplify it, along with relevant literature, arranged in a clear visual web. This helps me study for boards, see patterns across patients, and make connections between theory and practice."

This directly addresses the core vision.

---

## 🔧 Technical Requirements

### For Task System
**NPM Packages Needed:**
```bash
npm install date-fns react-datepicker
```

**Files to Modify:**
- `frontend/src/components/TaskModal.js` - Add UI fields
- `frontend/src/components/D3Graph.js` - Update node rendering
- `frontend/src/App.js` - Add notification system
- `backend/server.py` - Update task schema
- `backend/server.js` - Update task schema

**Data Model Changes:**
```javascript
// Add these fields to Task type
{
  dueDate: string | null,
  status: 'todo' | 'in-progress' | 'done' | 'blocked',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  completedAt: string | null,
  subtasks: Array<{id, label, completed}>
}
```

---

### For Literature Enhancement
**NPM Packages Needed:**
```bash
npm install react-pdf pdfjs-dist
```

**Files to Modify:**
- `frontend/src/components/LiteratureModal.js` - Add PDF viewer
- Add citation formatter utility
- Add DOI fetch function

---

### For Search Panel
**No new packages needed**

**Files to Modify:**
- `frontend/src/App.js` - Add results panel component
- Create `SearchResultsPanel.js` component

---

## 📅 Estimated Timeline

### If working 2-3 hours per day:

**Week 1:**
- Day 1: Task due date picker + display (2h)
- Day 2: Task completion checkbox + status (2h)
- Day 3: Notification system (2h)

**Week 2:**
- Day 1: Literature PDF viewer (2h)
- Day 2: Citation export (2h)
- Day 3: DOI auto-fill (2h)

**Week 3:**
- Day 1: Search results panel (2h)
- Day 2: Connection filters (2h)
- Day 3: UX polish (2h)

**Total:** 18 hours over 3 weeks

### If doing a focused sprint:
- Day 1: Task system (6h)
- Day 2: Literature (4h)
- Day 3: Search + Polish (4h)

**Total:** 14 hours over 3 days

---

## 🤔 Questions to Consider

1. **How many hours can you dedicate?**
   - Daily? (2-3h) → Steady progress over weeks
   - Sprint? (6h+) → Complete features in days

2. **What's most painful right now?**
   - Can't track task deadlines? → Task System
   - Can't read papers? → Literature Enhancement
   - Can't find things? → Search Panel

3. **Who's the primary user?**
   - You as a resident? → Focus on YOUR workflow
   - Other residents? → Get their feedback first
   - Future product? → Polish everything

4. **What's the MVP?**
   - Just task deadlines? → 2 hours
   - Full task system? → 6 hours
   - Everything above? → 20+ hours

---

## ✅ Decision Framework

Use this to decide what to build next:

**Choose Task System if:**
- [ ] You frequently miss deadlines
- [ ] You need to track patient follow-ups
- [ ] Task management is critical to your work
- [ ] You have 4-6 hours available

**Choose Literature Enhancement if:**
- [ ] You're doing literature reviews
- [ ] You need citations for papers
- [ ] You have many PDFs to reference
- [ ] You have 3-4 hours available

**Choose Quick Wins if:**
- [ ] You want multiple improvements
- [ ] You prefer variety
- [ ] You have 3 hours for mixed features
- [ ] You want to test different areas

**Choose Search Panel if:**
- [ ] Your knowledge base is getting large
- [ ] You spend time looking for things
- [ ] Navigation is becoming difficult
- [ ] You have 2-3 hours available

---

## 🎯 My Recommendation

**Build the Task System next.**

It's the highest value, most visible improvement that will make PGY3-HUB feel like a complete product. Everything else can be added later, but task management is foundational for a productivity tool.

**Ready to start?** Just say the word and I'll create a detailed implementation plan with step-by-step instructions!
