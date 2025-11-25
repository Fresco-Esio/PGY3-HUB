# AI Assistant Guidelines - PGY3-HUB

**Last Updated:** November 23, 2025 (ROADMAP Documentation Requirements Added)  
**For:** Any AI assistant working on this codebase

---

## 🎯 Project Overview

**PGY3-HUB** is a visual thinking tool for psychiatrists/psychologists to organize knowledge through an interactive mind map.

**Core Purpose:**
- Visual organization of Cases ↔ Topics ↔ Literature (the "knowledge triangle")
- Private clinical reflection space (notes outside medical charts)
- Board study tool using real case examples
- "Calm, focused digital studio for the mind"

**NOT:** A task management or productivity app. No deadlines, no notifications, no urgency.

---

## 📊 Version System (CRITICAL)

### Current Version: v0.7.0

**Format:** `v[MAJOR].[MINOR].[PATCH]`
- **MAJOR** (0.x.x): Architecture changes, complete overhauls
- **MINOR** (x.X.x): New features, significant enhancements
- **PATCH** (x.x.X): Bug fixes, small improvements

### When to Update Version

**PATCH (x.x.X)** - Increment for:
- Bug fixes
- Small UI improvements
- Performance optimizations
- Code refactoring (no new features)

**MINOR (x.X.0)** - Increment for:
- New features
- Significant UI enhancements
- New components or modals
- API additions

**MAJOR (X.0.0)** - Increment for:
- Architecture changes
- Breaking changes
- Complete redesigns
- Major framework updates

---

## 📝 MANDATORY: Update These Files After ANY Code Change

### 1. VERSION.md (ALWAYS)

**Location:** `/VERSION.md`

**What to update:**
```markdown
## Release History

### vX.X.X - "Feature Name" (Date)
**Status:** 🚧 In Development | ✅ Released

**Focus:** Brief description

**Changes:**
- [x] What you just implemented
- [ ] What's still planned

**Bug Fixes:** (if applicable)
- Fixed [specific issue]

**Technical:** (if significant)
- New files created
- Major refactors
```

### 2. CHANGELOG.md (ALWAYS for significant changes)

**Location:** `/CHANGELOG.md`

**What to update:**
```markdown
## [X.X.X] - YYYY-MM-DD - "Version Name"

### Added
- New features, components, or capabilities

### Changed
- Modifications to existing features

### Fixed
- Bug fixes and corrections

### Removed
- Deprecated or removed features

### Technical
- Implementation details, file changes
```

**Example:**
```markdown
### v0.6.1 - "Visual Clarity" (Oct 8, 2025)
**Status:** 🚧 In Development

**Changes:**
- [x] Focus mode state management in App.js
- [x] Click handler for node focus
- [ ] Radial layout algorithm (in progress)

**Technical:**
- Added focusMode, focusedNode, originalLayout states
- Modified handleNodeClick in App.js
```

---

### 3. ROADMAP.md (CRITICAL - When Working on ANY Feature)

**Location:** `/ROADMAP.md`

**IMPORTANT:** The ROADMAP is the master project tracker. Update it as you work, not just when you finish!

**What to update:**

#### A. Mark Individual Tasks Complete as You Go
```markdown
### Priority A: Focus Mode

**Features to Implement:**
1. **Focus Mode State Management**
   - [x] Add `focusMode` state to App.js  ← Change [ ] to [x] AS SOON AS DONE
   - [x] Add `focusedNode` state
   - [ ] Calculate connected nodes
```

#### B. Update Feature Status Header
```markdown
### Priority A: Focus Mode (HIGH PRIORITY) ⭐⭐⭐
**Effort:** 2-3 hours  
**Business Value:** HIGH
**Status:** � NOT STARTED  ← Update to 🟡 In Progress or ✅ COMPLETE
```

**Status Indicators:**
- `🔴 NOT STARTED` - Haven't begun work yet
- `🟡 In Progress` - Currently working on this
- `✅ COMPLETE` - All tasks done, tested, and documented

#### C. Update Phase Status When Complete
When ALL features in a phase are complete:

```markdown
## ✅ Phase 6: Visual Organization (COMPLETE - Oct 17, 2025)
```

Add completion date and change emoji from 🚀 to ✅.

#### D. Update Header Date
At the top of ROADMAP.md:
```markdown
**Updated:** November 23, 2025 (Your change description)
```

#### E. Move to Next Phase
When a phase completes, add a new "Phase X: [Next Focus]" section at the top showing what's next.

**Example Update Sequence:**
1. Start working on Focus Mode → Change status to `🟡 In Progress`
2. Complete state management → Mark those checkboxes `[x]`
3. Complete camera system → Mark those checkboxes `[x]`
4. All Focus Mode tasks done → Change status to `✅ COMPLETE (Nov 23, 2025)`
5. Phase 6 fully complete → Change header to `✅ Phase 6: ... (COMPLETE - Nov 23, 2025)`
6. Add `## 🚀 Phase 7: [Next Features]` section

**Why This Matters:**
- ROADMAP is the single source of truth for project status
- Other AIs need accurate status to know what's done
- Prevents duplicate work or confusion about progress
- Shows clear timeline of development

---

### 4. Implementation Plan (Active Work Doc)

**Location:** `/docs/development/[FEATURE]_IMPLEMENTATION.md` (or current feature doc)

**What to update:**

Mark checklist items:
```markdown
#### Step 1: Focus Mode State Management
- [x] Add `focusMode` state to App.js ← Change to [x]
- [x] Add `focusedNode` state to track selected node
- [ ] Add `originalLayout` state to store positions
```

Update progress table:
```markdown
| Task | Status | Time Spent | Notes |
|------|--------|------------|-------|
| Focus Mode - State | ✅ Complete | 30min | Added 3 states |
| Focus Mode - Activation | 🔴 Not Started | - | Next up |
```

---

### 5. App UI Version Display (When Incrementing Version)

**Location:** `frontend/src/App.js` (around line 1602)

**What to update:**
```javascript
<div className="mt-2 text-xs text-slate-400 font-mono">v0.6.0 - Visual Clarity</div>
```

Change to new version and feature name:
```javascript
<div className="mt-2 text-xs text-slate-400 font-mono">v0.7.0 - Literature Integration</div>
```

**When to update:** When incrementing MINOR or MAJOR version (not PATCH)

---

### 6. Session Documentation (Optional but Recommended)

**Location:** `/docs/archive/SESSION_SUMMARY_[DATE].md`

Create at end of work session:
```markdown
# Session Summary - Oct 8, 2025

## ✅ Completed
- Focus mode state management
- Node click handler

## 🚧 In Progress
- Radial layout algorithm

## ⏭️ Next Steps
- Complete radial layout
- Add visual hierarchy

## ⏱️ Time Spent
- 1 hour

## 📝 Notes
- Had to handle D3 node object conversion
- State management working cleanly
```

---

## 🔄 Workflow for Making Changes

### Step-by-Step Process

1. **Before Starting:**
   - Read `/VERSION.md` to know current version
   - Read `/ROADMAP.md` to understand priorities
   - Read `/docs/development/[FEATURE]_IMPLEMENTATION.md` for current work plan

2. **While Coding:**
   - Make changes to code files
   - Test thoroughly
   - Document any decisions or issues

3. **After Completing a Feature/Fix:**
   - ✅ Mark checklist items in implementation plan (`docs/development/`)
   - ✅ **Update ROADMAP.md immediately** (mark tasks [x], update status)
   - ✅ Add entry to VERSION.md
   - ✅ Add entry to CHANGELOG.md (for significant changes)
   - ✅ Increment version number if appropriate
   - ✅ Update package.json version if releasing
   - ✅ Update header dates in ROADMAP.md and VERSION.md

4. **If Completing Multiple Small Tasks:**
   - Update docs after each logical unit
   - Don't wait until everything is done
   - Keep documentation in sync with code

---

## 📋 File Organization Rules

### Active Work
**Location:** `/docs/development/`
- Current implementation plans
- Active feature specs
- Works in progress

**Example:** `FOCUS_MODE_IMPLEMENTATION.md`

### Completed Work
**Location:** `/docs/archive/`
- Finished implementation logs
- Historical session summaries
- Bug fix documentation

**When to move:** As soon as feature is complete and merged

### Feature Documentation
**Location:** `/docs/features/`
- User-facing feature docs
- API documentation
- Feature specifications

**Example:** `SPREADSHEET_IMPORT_FEATURE.md`

---

## 🎨 Code Style Guidelines

### React Components
- Functional components with hooks
- Use `useCallback` for event handlers
- Use `useMemo` for expensive calculations
- PropTypes or TypeScript for type safety

### State Management
- Local state with `useState`
- Lift state up when needed
- No Redux (keeping it simple)

### Styling
- Tailwind CSS for all styling
- Dark theme colors (slate/gray palette)
- Framer Motion for animations

### D3.js Integration
- D3 for visualization only (not React Flow)
- Force-directed graph layout
- Store simulation in refs, not state

---

## 🐛 Bug Fix Protocol

### When Fixing a Bug:

1. **Document the bug:**
   ```markdown
   ### Bug: [Brief description]
   **Symptoms:** What's happening
   **Cause:** Root cause analysis
   **Fix:** What you changed
   ```

2. **Update VERSION.md:**
   ```markdown
   **Bug Fixes:**
   - Fixed [issue] by [solution]
   ```

3. **Increment PATCH version:**
   - If version is v0.6.0 → v0.6.1
   - Update `package.json` files

4. **Test thoroughly:**
   - Verify fix works
   - Check for regressions
   - Update tests if applicable

---

## ✅ Quality Checklist

Before considering any work "complete":

- [ ] Code changes tested and working
- [ ] No console errors or warnings
- [ ] Implementation plan checklist updated
- [ ] ROADMAP.md status updated
- [ ] VERSION.md entry added
- [ ] Version number incremented (if appropriate)
- [ ] Comments added to complex code
- [ ] Related documentation updated

---

## 🚨 Critical Don'ts

**DO NOT:**
- ❌ Make changes without updating documentation
- ❌ Skip version increments for features
- ❌ Leave implementation plans outdated
- ❌ **Leave ROADMAP.md outdated or with wrong status indicators**
- ❌ **Mark features complete in code but leave ROADMAP showing "NOT STARTED"**
- ❌ Create new markdown files in root (use /docs)
- ❌ Delete archive files (they're historical record)
- ❌ Break the core vision (visual thinking, not productivity)
- ❌ Add notifications, deadlines, or urgency features

**DO:**
- ✅ Keep docs in sync with code
- ✅ **Update ROADMAP.md status as you work, not just when done**
- ✅ **Update phase completion dates when phases finish**
- ✅ Update version system religiously
- ✅ Follow the organizational structure
- ✅ Test before documenting as complete
- ✅ Preserve the "calm studio" aesthetic
- ✅ Focus on visual clarity and organization

---

## 📚 Key Files Reference

### Code
- `frontend/src/App.js` - Main application logic
- `frontend/src/components/D3Graph.js` - Visualization component
- `frontend/src/components/*Modal.js` - Node type modals
- `backend/server.py` - FastAPI backend
- `backend/server.js` - Express backend

### Documentation (CRITICAL)
- `/VERSION.md` - Version history (UPDATE ALWAYS)
- **`/ROADMAP.md`** - **Current priorities and task status (UPDATE AS YOU WORK)**
- `/CHANGELOG.md` - User-facing changelog (UPDATE for releases)
- `/README.md` - Project overview
- `/QUICK_START.md` - Setup instructions
- `/docs/development/` - Active work plans
- `/docs/archive/` - Completed work logs

### Configuration
- `frontend/package.json` - Frontend deps & version
- `backend/package.json` - Backend deps & version
- `.vscode/tasks.json` - VS Code tasks
- `.github/copilot-instructions.md` - Project context

---

## 🎯 Current Work Context (v0.7.0)

**Latest Release:** Focus Mode Complete (Oct 17, 2025)

**Recently Completed:**
- Advanced Focus Mode with localized physics ✅
- Smart camera centering and zoom ✅
- Multi-level spreading with BFS ✅
- Visual hierarchy enhancements ✅

**Next Up (Phase 7):**
- Smart Layout Algorithm (Priority B)
- Literature Enhancement (Priority C)
- Quick-Link Workflow (Priority D)

**Docs to Check First:**
- `/ROADMAP.md` - See Phase 7 priorities
- `/VERSION.md` - See v0.7.0 details
- `/docs/archive/FOCUS_MODE_COMPLETE.md` - Latest completed feature

---

## 💡 Tips for AI Assistants

1. **Always read context first:**
   - Check VERSION.md for current version
   - Read ROADMAP.md for priorities
   - Review implementation plan for current work

2. **Document as you go:**
   - Don't wait until feature is complete
   - Update checklists after each step
   - Add notes about decisions or issues

3. **Be specific in updates:**
   - "Added focus mode state" not "Updated App.js"
   - Include line numbers or function names
   - Note any tricky parts or gotchas

4. **Maintain the vision:**
   - This is a visual thinking tool, not a task manager
   - Calm and focused, not urgent and gamified
   - Beauty and clarity over features and complexity

5. **Ask when unclear:**
   - Version increment unclear? Ask user
   - Feature scope ambiguous? Clarify
   - Documentation format uncertain? Follow examples

---

## ✅ You're Ready!

With these guidelines, you should be able to:
- Make code changes that fit the project vision
- Update all documentation appropriately
- Follow the version system correctly
- Keep the codebase organized and professional

**Remember:** Documentation is as important as code. Keep them in sync!

---

**Questions?** Check existing docs in `/docs/` or ask the user.

**Ready to code?** Update VERSION.md first, then get started! 🚀
