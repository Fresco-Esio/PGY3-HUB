# Focus Mode & Smart Layout Implementation

**Started:** October 8, 2025 (Evening)  
**Status:** 🔴 In Progress  
**Estimated Time:** 3-4 hours total

---

## 🎯 Goals

### Primary Goal
Implement visual organization features to address user need:
> "Being able to visually see the connected cases at once. Nodes should web out and branch in a way that is easy to see and not cluttered."

### Features to Build
1. **Focus Mode** (2-3 hours)
2. **Smart Layout Algorithm** (1-2 hours)

---

## 📋 Implementation Checklist

### Phase 1: Focus Mode (Priority A)

#### Step 1: Focus Mode State Management
- [ ] Add `focusMode` state to App.js
- [ ] Add `focusedNode` state to track selected node
- [ ] Add `originalLayout` state to store positions before focus
- [ ] Create `enterFocusMode(node)` function
- [ ] Create `exitFocusMode()` function

#### Step 2: Focus Mode Activation
- [ ] Add click handler to D3Graph nodes
- [ ] Pass click handler from App.js to D3Graph
- [ ] Calculate 1st-degree connected nodes
- [ ] Store connection information

#### Step 3: Radial Layout Algorithm
- [ ] Create `calculateRadialLayout(centerNode, connectedNodes)` function
- [ ] Position center node at viewport center
- [ ] Arrange connected nodes in circle around center
- [ ] Calculate optimal radius based on node count
- [ ] Handle edge cases (0, 1, 2, many connections)

#### Step 4: Visual Hierarchy
- [ ] Dim unconnected nodes to 10% opacity
- [ ] Brighten selected node (1.2x scale, glow effect)
- [ ] Highlight connected nodes (normal brightness)
- [ ] Emphasize connection edges (thicker, brighter)
- [ ] Disable interaction on dimmed nodes

#### Step 5: Animations
- [ ] Smooth transition to radial layout (800ms duration)
- [ ] Fade in/out animations for opacity changes
- [ ] Scale animation for focused node
- [ ] Edge thickness animation

#### Step 6: Exit Mechanism
- [ ] ESC key listener
- [ ] Click on background/dimmed area
- [ ] Restore original layout
- [ ] Restore all opacities
- [ ] Re-enable all interactions
- [ ] Smooth transition back (800ms)

#### Step 7: UI Feedback
- [ ] Show "Focus Mode" indicator in UI
- [ ] Display focused node name/type
- [ ] Show connection count
- [ ] "Press ESC to exit" hint
- [ ] Optional: Mini-map showing context

---

### Phase 2: Smart Layout Algorithm (Priority B)

#### Step 1: Cluster Detection
- [ ] Implement connected components algorithm
- [ ] Identify isolated clusters in graph
- [ ] Detect Topic nodes as cluster centers
- [ ] Group Cases/Literature by primary Topic
- [ ] Handle orphaned nodes (no connections)

#### Step 2: Hierarchical Arrangement
- [ ] Position Topic nodes as cluster centers
- [ ] Calculate cluster bounding boxes
- [ ] Arrange clusters in grid or radial pattern
- [ ] Ensure adequate spacing between clusters
- [ ] Handle overlapping clusters

#### Step 3: Enhanced Force Simulation
- [ ] Add clustering force (attraction within cluster)
- [ ] Add separation force (repulsion between clusters)
- [ ] Improve collision detection
- [ ] Optimize force parameters:
  - [ ] Link strength
  - [ ] Charge force
  - [ ] Center force
  - [ ] Collision radius
- [ ] Test with various graph sizes

#### Step 4: Realign Button Integration
- [ ] Update `forceLayout()` function in App.js
- [ ] Apply cluster detection before layout
- [ ] Use hierarchical constraints
- [ ] Smooth animation during realignment
- [ ] Toast notification: "Organizing clusters..."
- [ ] Toast on completion: "Layout complete"

#### Step 5: Testing & Refinement
- [ ] Test with 5 nodes
- [ ] Test with 20 nodes
- [ ] Test with 50+ nodes
- [ ] Test with multiple disconnected clusters
- [ ] Test with fully connected graph
- [ ] Test with linear chain
- [ ] Adjust parameters for best results

---

## 🎨 Design Specifications

### Focus Mode Visuals

**Focused Node:**
- Scale: 1.2x
- Opacity: 100%
- Glow: 0 0 20px rgba(59, 130, 246, 0.6) (blue glow)
- Z-index: Bring to front

**Connected Nodes:**
- Scale: 1.0x
- Opacity: 100%
- Glow: Subtle 0 0 10px rgba(255, 255, 255, 0.2)
- Z-index: Normal

**Connection Edges:**
- Stroke-width: 3px (up from 1.5px)
- Opacity: 100%
- Color: Brighter version of normal color

**Unconnected Nodes:**
- Scale: 1.0x
- Opacity: 10%
- Glow: None
- Pointer-events: none (not clickable)

**Radial Layout:**
- Center node: Exact viewport center
- Connected nodes: Circle with radius = 200-400px (based on count)
- Angular spacing: 360° / nodeCount
- First node at 0° (top), clockwise

### Smart Layout Visuals

**Cluster Arrangement:**
- Cluster spacing: Minimum 300px between cluster centers
- Topic node: Center of cluster
- Orbit radius: 150-200px for cases/literature
- Between-cluster repulsion: Strong

**Force Parameters:**
```javascript
{
  linkStrength: 0.5,
  chargeStrength: -300,
  clusterStrength: 0.3,  // NEW
  clusterSeparation: 400, // NEW
  collisionRadius: 80
}
```

---

## 📝 Code Files to Modify

### App.js
- Add focus mode state
- Add enterFocusMode/exitFocusMode functions
- Update handleNodeClick to trigger focus mode
- Update forceLayout with cluster algorithm
- Add ESC key listener for exit

### D3Graph.js
- Accept onNodeClick prop
- Modify node rendering for focus mode states
- Apply opacity/scale based on focus state
- Update edge rendering for focus mode
- Handle focus mode animations

### New Utility Files (Optional)
- `utils/radialLayout.js` - Radial layout calculator
- `utils/clusterDetection.js` - Graph clustering algorithm
- `utils/focusMode.js` - Focus mode state management

---

## 🧪 Testing Plan

### Focus Mode Tests
1. **Single connection**: Topic with 1 case
2. **Few connections**: Topic with 3-5 nodes
3. **Many connections**: Topic with 10+ nodes
4. **No connections**: Orphaned node (should show message?)
5. **Full graph**: Focus on highly connected node
6. **Exit behavior**: ESC, click, repeated focus
7. **Edge cases**: Focus during animation, rapid clicks

### Smart Layout Tests
1. **Empty graph**: No nodes
2. **Single cluster**: All nodes connected
3. **Multiple clusters**: 2-3 distinct groups
4. **Linear chain**: A→B→C→D
5. **Star pattern**: Hub with many spokes
6. **Dense graph**: Everything connected to everything
7. **Realign performance**: Large graphs (50+ nodes)

---

## 💡 Implementation Notes

### Focus Mode Algorithm
```javascript
// Pseudocode for focus mode
enterFocusMode(selectedNode) {
  // 1. Store original positions
  originalLayout = nodes.map(n => ({id: n.id, x: n.x, y: n.y}));
  
  // 2. Find connected nodes
  const connected = findConnectedNodes(selectedNode);
  
  // 3. Calculate radial positions
  const center = {x: viewportWidth/2, y: viewportHeight/2};
  const radius = 300;
  const angleStep = (2 * Math.PI) / connected.length;
  
  connected.forEach((node, i) => {
    node.targetX = center.x + radius * Math.cos(i * angleStep);
    node.targetY = center.y + radius * Math.sin(i * angleStep);
  });
  
  // 4. Update node states
  nodes.forEach(node => {
    if (node.id === selectedNode.id) {
      node.focusState = 'focused';
      node.targetX = center.x;
      node.targetY = center.y;
    } else if (connected.includes(node)) {
      node.focusState = 'connected';
    } else {
      node.focusState = 'dimmed';
    }
  });
  
  // 5. Animate transitions
  animateToFocusLayout();
}
```

### Cluster Detection Algorithm
```javascript
// Pseudocode for clustering
detectClusters(nodes, edges) {
  // Union-Find algorithm for connected components
  const parent = {};
  const rank = {};
  
  // Initialize
  nodes.forEach(n => {
    parent[n.id] = n.id;
    rank[n.id] = 0;
  });
  
  // Find
  function find(id) {
    if (parent[id] !== id) {
      parent[id] = find(parent[id]);
    }
    return parent[id];
  }
  
  // Union
  function union(id1, id2) {
    const root1 = find(id1);
    const root2 = find(id2);
    if (root1 === root2) return;
    
    if (rank[root1] < rank[root2]) {
      parent[root1] = root2;
    } else {
      parent[root2] = root1;
      if (rank[root1] === rank[root2]) rank[root1]++;
    }
  }
  
  // Process edges
  edges.forEach(e => union(e.source, e.target));
  
  // Group by cluster
  const clusters = {};
  nodes.forEach(n => {
    const cluster = find(n.id);
    if (!clusters[cluster]) clusters[cluster] = [];
    clusters[cluster].push(n);
  });
  
  return Object.values(clusters);
}
```

---

## 🎯 Success Criteria

### Focus Mode
- [ ] Click node → smooth transition to focus view
- [ ] Radial layout clearly shows connections
- [ ] Unconnected nodes properly dimmed
- [ ] ESC reliably exits focus mode
- [ ] Animation is smooth (60fps)
- [ ] Works with 1, 5, 10, 20+ connections
- [ ] UI shows clear feedback (mode indicator, exit hint)

### Smart Layout
- [ ] Realign button organizes nodes intelligibly
- [ ] Clusters are visually separated
- [ ] Topics act as cluster centers
- [ ] Cases/Literature orbit their topics
- [ ] No overlapping nodes
- [ ] Works with various graph sizes
- [ ] Performance acceptable (<2s for 50 nodes)

---

## 📈 Progress Tracking

| Task | Status | Time Spent | Notes |
|------|--------|------------|-------|
| Roadmap update | ✅ Complete | 30min | All docs updated |
| Focus Mode planning | ✅ Complete | 15min | This document |
| Smart Layout planning | ✅ Complete | 15min | This document |
| Focus Mode - State | 🔴 Not Started | - | Next up |
| Focus Mode - Activation | 🔴 Not Started | - | |
| Focus Mode - Layout | 🔴 Not Started | - | |
| Focus Mode - Visuals | 🔴 Not Started | - | |
| Focus Mode - Exit | 🔴 Not Started | - | |
| Smart Layout - Cluster | 🔴 Not Started | - | |
| Smart Layout - Forces | 🔴 Not Started | - | |
| Smart Layout - Realign | 🔴 Not Started | - | |
| Testing & Polish | 🔴 Not Started | - | |

---

## 🚀 Ready to Start!

Documentation updated. Ready to begin implementation.

**First step:** Implement Focus Mode state management in App.js

Would you like me to proceed?
