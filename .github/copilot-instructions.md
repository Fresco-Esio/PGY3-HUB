# PGY3-HUB - Mind Mapping Tool for Psychiatry Residents

## Project Overview
PGY3-HUB is an immersive mind mapping application designed for psychiatry residents to organize and connect psychiatric knowledge, clinical cases, tasks, and literature. The application uses a modern React frontend with FastAPI backend, focusing on an intuitive, visually engaging experience.

## Architecture

### Frontend (React)
- **Structure**: Single-page application built with React and @xyflow/react (React Flow)
- **State Management**: React hooks (useState, useCallback) for local state
- **Styling**: Tailwind CSS with custom components
- **Key Libraries**: 
  - `@xyflow/react` - Visualization and mind mapping
  - `d3-force` - Force-directed graph layout algorithm
  - `@tiptap/react` - Rich text editing
  - `lucide-react` - Icons
  - `axios` - API communication

### Backend (Python/FastAPI)
- **Framework**: FastAPI with Pydantic models
- **Storage**: Local JSON file storage (`mindmap_data.json`)
- **API**: RESTful endpoints with typed models

## Key Components

### Mind Map Visualization
- React Flow manages the interactive graph with nodes and edges
- Custom node types defined for different psychiatric content (topics, cases, tasks, literature)
- Force-directed layout algorithm for auto-arrangement

### Edge Handling
- Custom floating edges in `frontend/src/utils/floatingEdgeUtils.js`
- Geometric calculations for line-rectangle intersections
- Real-time edge updates during node dragging

### Data Flow
1. Mind map data loads from backend on application start
2. User interactions trigger state updates
3. Changes are auto-saved to localStorage and backend
4. Data cleaning occurs before backend submission to prevent validation errors

## Important Patterns

### Node & Edge Management
```javascript
// Nodes and edges use React Flow's state management
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);

// Custom handler to optimize drag performance
const handleNodesChange = useCallback((changes) => {
  // Apply changes to React Flow state
  onNodesChange(changes);
  
  // Extract position changes and update connected edges
  const positionChanges = changes.filter(change => 
    change.type === 'position' && change.position
  );
  
  if (positionChanges.length > 0) {
    // Update edges and mind map data...
  }
}, [onNodesChange, setEdges, setMindMapData]);
```

### Backend Data Communication
```javascript
// Data is cleaned before sending to prevent validation errors
const saveToBackend = useCallback(async (data) => {
  try {
    // Deep clone the data to avoid modifying the original
    const cleanData = {
      topics: JSON.parse(JSON.stringify(data.topics || [])),
      cases: JSON.parse(JSON.stringify(data.cases || [])),
      // ...other collections
    };
    
    // Clean function to remove problematic properties
    const cleanObject = (obj) => {
      // Return clean object with only expected properties
    };
    
    // Apply cleaning to all collections
    cleanData.topics = cleanData.topics.map(cleanObject);
    // ...clean other collections
    
    // Send to backend
    const response = await axios.put(`${API}/mindmap-data`, cleanData);
  } catch (err) {
    console.error('Failed to save to backend:', err);
  }
}, []);
```

## Developer Workflows

### Setup & Running
1. **Backend**: `cd backend && uvicorn server:app --reload --port 8001`
2. **Frontend**: `cd frontend && npm start`
3. **Combined**: `cd frontend && npm run dev` (uses concurrently)

### Data Persistence
- Client-side: LocalStorage with versioning
- Server-side: JSON file (`backend/mindmap_data.json`)
- Auto-save with debounce (800ms)

### Debugging Tips
- Check browser console for save/load errors
- Inspect 422 validation errors from backend (usually invalid properties)
- Use React DevTools to inspect component state

## Project-Specific Conventions

### Node Identifiers
- Node IDs follow pattern: `{type}-{id}` (e.g., `topic-123`, `case-456`)
- Collections in data follow pattern: `{type}s` except for `literature`
- When parsing IDs: `const [type, id] = node.id.split('-')`

### Rich Text
- TipTap editor used for rich text content
- HTML content stored directly in data objects

### Performance Optimization
- Debounced auto-save (800ms)
- Window.requestAnimationFrame for UI updates during dragging
- Edge re-rendering optimizations with timestamped data objects

## Integration Points

### External Dependencies
- @xyflow/react - Core visualization library
- d3-force - Layout algorithm for node positioning
- axios - HTTP client for backend communication

### Cross-Component Communication
- Props for direct parent-child communication
- Callback functions for child-to-parent updates
- Custom event handlers for React Flow interactions
