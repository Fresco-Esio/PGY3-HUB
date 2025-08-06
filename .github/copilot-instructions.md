# PGY3-HUB - Mind Mapping Tool for Psychiatry Residents

## Project Overview

PGY3-HUB is an immersive mind mapping application designed for psychiatry residents to organize and connect psychiatric knowledge, clinical cases, tasks, and literature. The application features a modern React frontend with dual backend support (FastAPI/Python and Express.js/Node.js), focusing on an intuitive, visually engaging experience for psychiatric training.

## Architecture

### Frontend (React)

- **Framework**: React 19 with Create React App and CRACO configuration
- **Structure**: Single-page application with component-based architecture
- **Visualization**: @xyflow/react (React Flow) for interactive mind mapping
- **State Management**: React hooks (useState, useCallback, useRef) with optimized re-rendering
- **Styling**: Tailwind CSS with custom components and responsive design
- **Build Tools**: CRACO for custom webpack configuration, PostCSS, Autoprefixer
- **Key Libraries**:
  - `@xyflow/react` ^12.8.1 - Core visualization and mind mapping
  - `d3-force` (lazy-loaded) - Force-directed graph layout algorithm
  - `@tiptap/react` ^2.25.0 - Rich text editing with StarterKit
  - `framer-motion` ^12.23.6 - Animations and transitions
  - `lucide-react` ^0.525.0 - Icon library
  - `axios` ^1.8.4 - HTTP client for API communication
  - `react-router-dom` ^7.6.3 - Client-side routing
  - `dagre` ^0.8.5 - Graph layout algorithms

### Backend (Dual Support)

- **Primary Backend**: FastAPI (Python) with Pydantic v2 models
- **Alternative Backend**: Express.js (Node.js) for development flexibility
- **Storage**: Local JSON file storage (`mindmap_data.json` or `mindmap-data.json`)
- **File Uploads**: Multer (Node.js) / FastAPI file handling for PDF uploads
- **API**: RESTful endpoints with comprehensive type validation
- **CORS**: Configured for local development (http://localhost:3000)

## Key Components

### Data Models

- **PsychiatricTopic**: Learning topics with progress tracking, flashcards, categories
- **PatientCase**: Clinical cases with structured psychiatric fields (chief complaint, presentation, medication history, therapy progress, defense patterns, clinical reflection)
- **Task**: Task management with priorities, due dates, and linking to cases/topics
- **Literature**: Research papers with PDF upload support, authors, publication details
- **Connections**: Mind map edges/relationships between nodes with labels

### Mind Map Visualization

- React Flow manages the interactive graph with custom node types and floating edges
- Four distinct node types: `topic`, `case`, `task`, `literature` with specialized rendering
- Custom floating edges with geometric intersection calculations
- Force-directed layout algorithm for auto-arrangement using D3.js (lazy-loaded)
- Real-time edge updates during node dragging with performance optimizations

### Component Architecture

- **LazyComponents.js**: Lazy loading wrapper for performance optimization
- **FloatingEdge.js**: High-performance edge component with direct path calculation
- **RichTextEditor.js**: TipTap-based rich text editing with toolbar
- **TemplateManager.js**: Template system for creating predefined node configurations
- **LiteratureModal.js**: Dedicated modal for literature node interactions
- **NodeSelector.js**: Node creation interface with template selection
- **TemplateManager.js**: Template creation and management interface
- **CaseModal.js**: Patient case modal with tabbed interface including timeline integration
- **VerticalTimeline.js**: Interactive timeline component with physics-based rope simulation and scroll navigation

### Timeline System

- **Interactive Timeline**: Physics-based vertical timeline for tracking patient case progression over time
- **Physics Simulation**: Rope-based physics with adjustable stiffness, damping, and force calculations for natural node movement
- **Scroll Navigation**: Custom scrolling with animated gradient scrollbars and navigation buttons (Top, Bottom, Latest)
- **Modal Integration**: Timeline embedded as a tab within CaseModal with proper height constraints for modal context
- **Node Interactions**: Draggable timeline nodes with collision detection and smooth animations
- **Performance Optimized**: Throttled physics updates, memoized calculations, and efficient scroll handling

### Performance Optimizations

- Lazy loading of heavy dependencies (D3.js, components)
- Memoized node data and throttled layout calculations
- Chunked data processing for large datasets
- Optimized re-rendering with React.memo and useCallback
- Error boundaries for React Flow stability
- Background auto-save with debounce (800ms)

## Data Flow & State Management

### Loading & Initialization

1. Application starts with optimized loading screen with progress indicators
2. Local storage checked first for instant startup (cache-first approach)
3. Background sync with backend without blocking UI
4. Quick layout applied immediately, force layout applied after React Flow ready
5. Error boundaries handle React Flow dimension errors gracefully

### Auto-Save Architecture

- **Debounced Auto-save**: 800ms delay to batch changes efficiently
- **Dual Persistence**: LocalStorage for offline capability + backend for durability
- **Data Cleaning**: Removes React-specific properties before backend submission
- **Optimistic Updates**: UI updates immediately, backend sync in background
- **Conflict Resolution**: Background sync detects and resolves data conflicts

### State Management Pattern

```javascript
// Centralized mind map data state
const [mindMapData, setMindMapData] = useState({
  topics: [],
  cases: [],
  tasks: [],
  literature: [],
  connections: [],
});

// React Flow state for visualization
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);

// Performance-optimized node change handler
const handleNodesChange = useCallback(
  (changes) => {
    onNodesChange(changes); // Update React Flow

    // Extract position changes for connected edges
    const positionChanges = changes.filter(
      (change) => change.type === "position" && change.position
    );

    if (positionChanges.length > 0) {
      // Update edges and mind map data efficiently
    }
  },
  [onNodesChange, setEdges, setMindMapData]
);
```

## Critical Implementation Patterns

### Backend Data Communication & Validation

```javascript
// Data cleaning prevents Pydantic validation errors
const saveToBackend = useCallback(async (data) => {
  try {
    // Deep clone to avoid modifying original data
    const cleanData = {
      topics: JSON.parse(JSON.stringify(data.topics || [])),
      cases: JSON.parse(JSON.stringify(data.cases || [])),
      tasks: JSON.parse(JSON.stringify(data.tasks || [])),
      literature: JSON.parse(JSON.stringify(data.literature || [])),
      connections: (data.connections || []).map((conn, index) => ({
        id: String(conn.id || `${Date.now()}-${index}-conn`),
        source: conn.source || "",
        target: conn.target || "",
        label: conn.label || "",
      })),
    };

    // Filter invalid connections
    cleanData.connections = cleanData.connections.filter(
      (conn) =>
        conn.source &&
        conn.target &&
        typeof conn.source === "string" &&
        typeof conn.target === "string"
    );

    const response = await axios.put(`${API}/mindmap-data`, cleanData, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Backend save failed:", err.response?.data || err.message);
  }
}, []);
```

### High-Performance Edge Rendering

```javascript
// FloatingEdge component optimizes real-time edge updates
const FloatingEdge = memo(
  ({ id, source, target, sourceX, sourceY, targetX, targetY, ...props }) => {
    const { getNode } = useReactFlow();

    // Memoized path calculation for performance
    const [edgePath, labelX, labelY] = useMemo(() => {
      const sourceNode = getNode(source);
      const targetNode = getNode(target);

      if (!sourceNode || !targetNode) return ["", 0, 0];

      return getFloatingEdgePath({
        sourceNode,
        targetNode,
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
    }, [source, target, sourceX, sourceY, targetX, targetY, getNode]);

    return <BaseEdge path={edgePath} {...props} />;
  }
);
```

### Node Lifecycle Management

```javascript
// Optimized node creation with proper cleanup
const handleCreateNode = useCallback(
  (nodeType, templateId) => {
    const dataId = Date.now();
    const id = `${nodeType}-${dataId}`;

    // Template-based or default node data
    let nodeData = templates.find((t) => t.id === templateId)?.data || {
      id: dataId,
      label: `New ${nodeType}`,
    };

    // Psychiatric case fields normalization
    if (nodeType === "case") {
      nodeData = {
        ...nodeData,
        chiefComplaint:
          nodeData.chiefComplaint || nodeData.chief_complaint || "",
        initialPresentation:
          nodeData.initialPresentation || nodeData.initial_presentation || "",
        currentPresentation:
          nodeData.currentPresentation || nodeData.current_presentation || "",
        medicationHistory:
          nodeData.medicationHistory || nodeData.medication_history || "",
        therapyProgress:
          nodeData.therapyProgress || nodeData.therapy_progress || "",
        defensePatterns:
          nodeData.defensePatterns || nodeData.defense_patterns || "",
        clinicalReflection:
          nodeData.clinicalReflection || nodeData.clinical_reflection || "",
      };
    }

    const newNode = {
      id,
      type: nodeType,
      position: { x: window.innerWidth / 3, y: window.innerHeight / 2 },
      data: { ...nodeData, onDelete: () => handleDeleteNode(id) },
    };

    // Update both visualization and data
    setNodes((n) => n.concat(newNode));
    setMindMapData((d) => {
      const key = nodeType === "literature" ? "literature" : `${nodeType}s`;
      return { ...d, [key]: [...(d[key] || []), nodeData] };
    });
  },
  [setNodes, setMindMapData, templates, handleDeleteNode]
);
```

### Timeline Modal Integration

```javascript
// Modal-specific height constraints for timeline scrolling
const scrollContainer = {
  height: "80vh",
  maxHeight: "600px",
  overflow: "hidden", // Let content handle scrolling
};

// Fixed content height for proper modal context
const contentContainer = {
  minHeight: "800px", // Fixed height instead of 100vh for modal
  position: "relative",
};

// Scroll navigation functions
const scrollToTop = useCallback(() => {
  if (scrollContainerRef.current) {
    scrollContainerRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}, []);
```

## Project-Specific Conventions

### Node Identifiers

- Node IDs follow pattern: `{type}-{id}` (e.g., `topic-123`, `case-456`)
- Collections in data follow pattern: `{type}s` except for `literature`
- When parsing IDs: `const [type, id] = node.id.split('-')`

### Field Naming Conventions

- **Frontend**: Uses camelCase (e.g., `chiefComplaint`, `initialPresentation`)
- **Backend**: Supports both camelCase and snake_case for compatibility
- **Case Field Mapping**: Frontend normalizes snake_case to camelCase during data conversion

### Rich Text

- TipTap editor used for rich text content with StarterKit extensions
- HTML content stored directly in data objects
- Toolbar component provides formatting options

### Performance Optimization

- Debounced auto-save (800ms)
- Lazy loading of D3.js and heavy components
- Window.requestAnimationFrame for UI updates during dragging
- Edge re-rendering optimizations with timestamped data objects
- Error boundaries for React Flow stability

## Developer Workflows

### Setup & Running

1. **Backend Python (Primary)**: `cd backend && uvicorn server:app --reload --port 8001`
2. **Backend Node.js (Alternative)**: `cd backend && node server.js`
3. **Frontend**: `cd frontend && npm start`
4. **Combined Development**: `cd frontend && npm run dev` (uses concurrently to start both backend and frontend)
5. **VS Code Hotkey**: Use `Ctrl+Shift+B` to trigger "Start Development Server" task for quick startup

### VS Code Development Environment

- **Tasks Configuration**: `.vscode/tasks.json` with "Start Development Server" as default build task
- **Keybindings**: `.vscode/keybindings.json` with `Ctrl+Shift+B` mapped to development server startup
- **Hotkey Script**: `start-dev-hotkey.bat` for Windows development with concurrent backend/frontend startup
- **Development Workflow**: Optimized for rapid iteration with single-key server startup

### Data Persistence

- **Client-side**: LocalStorage with versioning and cache-first loading
- **Server-side**: JSON file storage (`backend/mindmap_data.json` for Python, `backend/mindmap-data.json` for Node.js)
- **Auto-save**: Debounced auto-save (800ms) with dual persistence strategy
- **File Uploads**: PDF uploads stored in `backend/uploads/` directory

### Error Handling & Recovery

- React Flow error boundaries for dimension errors during animations
- Graceful fallback for failed force layout calculations
- Validation error logging for backend 422 responses
- Background sync retry mechanism for network failures

### Debugging Tips

- Check browser console for save/load errors and validation details
- Monitor network tab for 422 validation errors from backend
- Use React DevTools to inspect component state and re-rendering
- Check `mindMapData` state structure for data consistency
- Verify edge source/target node existence for connection errors

## Integration Points

### External Dependencies

- @xyflow/react - Core visualization library
- d3-force - Layout algorithm for node positioning
- axios - HTTP client for backend communication
- framer-motion - Animation library for UI transitions
- @tiptap/react - Rich text editing capabilities

### Cross-Component Communication

- Props for direct parent-child communication
- Callback functions for child-to-parent updates
- Custom event handlers for React Flow interactions
- Global state management through centralized `mindMapData`
- **Timeline Integration**: VerticalTimeline component embedded within CaseModal's tabbed interface
- **Modal Context**: Timeline operates within modal height constraints with fixed scroll containers

### API Configuration

- **Backend URL**: Configurable via `REACT_APP_BACKEND_URL` environment variable
- **Default**: `http://localhost:8000` with fallback to port 8001
- **CORS**: Configured for local development at `http://localhost:3000`
- **File Uploads**: Multer (Node.js) / FastAPI multipart handling

## Current Architecture Notes

### Emergency Data Management

- Current implementation includes emergency data clearing on load (line 3311 in App.js)
- Templates are loaded with mock data for development
- Force layout applied with delay to ensure React Flow readiness

### Key Features

- **Keyboard Shortcuts**: Ctrl+N (new node), Ctrl+E (edit mode), Ctrl+R (realign), Esc (clear selection)
- **Category Filtering**: Focus on specific node types (topic, case, task, literature)
- **Template System**: Predefined node templates for quick creation
- **Literature Modal**: Dedicated interface for literature node interactions
- **Timeline Integration**: Interactive vertical timeline within CaseModal with scroll navigation
- **Physics-Based Timeline**: Rope simulation for natural timeline node movement and interactions
- **Auto-save Status**: Visual indicators for save state and last saved time
