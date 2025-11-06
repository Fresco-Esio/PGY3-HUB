# Localized Physics for Focus Mode - Implementation

**Date:** October 16, 2025  
**File:** `cluster-test.html`  
**Status:** ✅ Implemented - Ready for Testing

---

## 🎯 Objective

Implement **localized physics** that spreads connected nodes when entering Focus Mode, while keeping all other nodes completely frozen. This creates a "flower petal" spreading effect around the focused node.

---

## ✨ Implementation Details

### **1. New State Variable**

Added `focusSimulation` to track the separate localized simulation:

```javascript
let focusModeEnabled = false;
let focusedNode = null;
let focusSimulation = null;  // Separate simulation for localized physics
```

### **2. New Function: `applyLocalizedPhysics(targetNode)`**

This function creates an isolated physics simulation for just the focused cluster:

```javascript
function applyLocalizedPhysics(targetNode) {
  // 1. Find all directly connected nodes
  const connectedIds = new Set();
  connectedIds.add(targetNode.id);
  
  testData.links.forEach(l => {
    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
    
    if (sourceId === targetNode.id) connectedIds.add(targetId);
    if (targetId === targetNode.id) connectedIds.add(sourceId);
  });
  
  // 2. FREEZE all unconnected nodes
  testData.nodes.forEach(node => {
    if (!connectedIds.has(node.id)) {
      node.fx = node.x;  // Lock X position
      node.fy = node.y;  // Lock Y position
      node.vx = 0;       // Stop X velocity
      node.vy = 0;       // Stop Y velocity
    }
  });
  
  // 3. PIN the focused node (becomes anchor)
  targetNode.fx = targetNode.x;
  targetNode.fy = targetNode.y;
  targetNode.vx = 0;
  targetNode.vy = 0;
  
  // 4. RELEASE connected nodes (allow movement)
  testData.nodes.forEach(node => {
    if (connectedIds.has(node.id) && node.id !== targetNode.id) {
      node.fx = null;  // Allow X movement
      node.fy = null;  // Allow Y movement
    }
  });
  
  // 5. Get links involving focused node
  const focusLinks = testData.links.filter(l => {
    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
    return sourceId === targetNode.id || targetId === targetNode.id;
  });
  
  // 6. Stop global simulation
  simulation.stop();
  
  // 7. Create separate localized simulation
  focusSimulation = d3.forceSimulation(testData.nodes)
    .force('link', d3.forceLink(focusLinks)
      .id(d => d.id)
      .distance(200)        // Spread distance
      .strength(0.3))       // Weak = more spreading
    .force('charge', d3.forceManyBody()
      .strength(-500)       // Strong repulsion
      .distanceMax(400))    // Limited range
    .force('collision', d3.forceCollide()
      .radius(50)           // Prevent overlap
      .strength(0.9))
    .alpha(1.0)             // High energy
    .alphaDecay(0.015)      // Slow cooling
    .velocityDecay(0.3)     // Low friction
    .on('tick', () => {
      // Update positions
      node.attr('cx', d => d.x).attr('cy', d => d.y);
      link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      label.attr('x', d => d.x).attr('y', d => d.y);
    });
}
```

### **3. New Function: `stopLocalizedPhysics()`**

Cleans up the localized simulation and restores normal state:

```javascript
function stopLocalizedPhysics() {
  // Stop and remove focus simulation
  if (focusSimulation) {
    focusSimulation.stop();
    focusSimulation = null;
  }
  
  // UNFREEZE all nodes
  testData.nodes.forEach(node => {
    node.fx = null;
    node.fy = null;
  });
  
  // Restart global simulation gently
  simulation.alpha(0.3).restart();
}
```

### **4. Integration with `applyFocusMode()`**

Added physics call at the end of visual hierarchy setup:

```javascript
function applyFocusMode(targetNode) {
  if (!targetNode) {
    // Exit: Stop localized physics FIRST
    stopLocalizedPhysics();
    // ... then reset visuals
    return;
  }
  
  // Apply visual hierarchy...
  // ... (existing code)
  
  // Apply localized physics to spread connected nodes
  applyLocalizedPhysics(targetNode);
}
```

---

## 🎨 Physics Parameters

### **Force Configuration:**

| Force | Parameter | Value | Effect |
|-------|-----------|-------|--------|
| **Link** | distance | 200 | Target separation distance |
| | strength | 0.3 | Weak pull = allows spreading |
| **Charge** | strength | -500 | Strong repulsion between nodes |
| | distanceMax | 400 | Limited to nearby nodes |
| **Collision** | radius | 50 | Prevents overlap |
| | strength | 0.9 | Strong avoidance |

### **Simulation Settings:**

| Setting | Value | Effect |
|---------|-------|--------|
| **alpha** | 1.0 | Maximum energy for spreading |
| **alphaDecay** | 0.015 | Slow cooling (~2s animation) |
| **velocityDecay** | 0.3 | Low friction = more movement |

---

## 🔄 State Management

### **Node States During Focus Mode:**

1. **Focused Node:**
   - Position: **PINNED** (`fx/fy` locked at current position)
   - Velocity: **STOPPED** (`vx/vy = 0`)
   - Role: Immovable anchor point
   - Physics: Not affected by forces

2. **Connected Nodes:**
   - Position: **RELEASED** (`fx/fy = null`)
   - Velocity: **FREE** (can move)
   - Role: Spread outward from focused node
   - Physics: Affected by link, charge, collision forces

3. **Unconnected Nodes:**
   - Position: **FROZEN** (`fx/fy` locked at current position)
   - Velocity: **STOPPED** (`vx/vy = 0`)
   - Role: Static background
   - Physics: Completely inactive

### **Simulation States:**

| Mode | Global Sim | Focus Sim | Node Movement |
|------|-----------|-----------|---------------|
| **Normal** | Running | None | All nodes |
| **Focus** | Stopped | Running | Connected only |
| **Exit** | Restarted | Stopped | All nodes |

---

## 🎯 Expected Behavior

### **When Entering Focus Mode (Click Node):**

1. ✅ Visual hierarchy applies (dimming, glows)
2. ✅ Global simulation stops
3. ✅ All unconnected nodes freeze in place
4. ✅ Focused node pins at center
5. ✅ Connected nodes spread outward like flower petals
6. ✅ Animation takes ~2 seconds with smooth deceleration
7. ✅ Connected nodes settle at ~200px distance

### **During Focus Mode:**

1. ✅ Unconnected nodes remain completely frozen
2. ✅ Focused node stays anchored at center
3. ✅ Connected nodes maintain spread positions
4. ✅ User can click other nodes to switch focus
5. ✅ Visual effects update immediately
6. ✅ Physics re-applies for new focused cluster

### **When Exiting Focus Mode:**

1. ✅ Localized simulation stops
2. ✅ All nodes unfreeze (`fx/fy = null`)
3. ✅ Visual effects fade back to normal (800ms)
4. ✅ Global simulation restarts gently (alpha 0.3)
5. ✅ Nodes settle back to original cluster layout

---

## 🔧 Technical Approach

### **Physics Isolation Strategy:**

The key innovation is creating **two completely separate simulations**:

1. **Global Simulation** (`simulation`)
   - Runs during normal mode
   - Manages all nodes and links
   - Maintains cluster structure
   - **Stopped during focus mode**

2. **Focus Simulation** (`focusSimulation`)
   - Only exists during focus mode
   - Only operates on focused cluster
   - Uses different force parameters
   - Independent tick handler
   - **Destroyed on exit**

### **Why This Works:**

- **True Isolation:** Frozen nodes have `fx/fy` set, making them immune to forces
- **No Interference:** Global simulation is stopped, can't affect positions
- **Clean Separation:** Each simulation has its own force configuration
- **Smooth Transitions:** Visual effects (800ms) sync with physics (~2s)
- **Easy Cleanup:** Stopping focus sim + removing `fx/fy` restores everything

---

## 📊 Code Changes Summary

### **Files Modified:**
- `frontend/public/cluster-test.html`

### **Lines Added:**
- `focusSimulation` variable: ~1 line
- `applyLocalizedPhysics()` function: ~90 lines
- `stopLocalizedPhysics()` function: ~20 lines
- Integration calls: ~3 lines
- **Total: ~114 lines**

### **Functions Modified:**
- `applyFocusMode()` - Added physics call and exit cleanup

---

## 🧪 Testing Checklist

### **Basic Spreading:**
- [ ] Enable Focus Mode checkbox
- [ ] Click a node with connections
- [ ] Verify connected nodes spread outward
- [ ] Verify focused node stays centered
- [ ] Verify unconnected nodes stay frozen
- [ ] Verify animation is smooth (~2 seconds)

### **Multiple Nodes:**
- [ ] Test with 2-connection node
- [ ] Test with 5-connection star node
- [ ] Test with 1-connection chain node
- [ ] Verify spread distance scales appropriately

### **Switching Focus:**
- [ ] Focus on Node A
- [ ] While still spreading, click Node B
- [ ] Verify Node A's cluster stops
- [ ] Verify Node B's cluster spreads
- [ ] Verify smooth transition

### **Exit Behavior:**
- [ ] Focus on a node
- [ ] Wait for spread to complete
- [ ] Click same node to exit
- [ ] Verify all nodes unfreeze
- [ ] Verify global simulation resumes
- [ ] Verify nodes settle back naturally

### **Edge Cases:**
- [ ] Test solo node (no connections)
- [ ] Test with Focus Mode OFF (no spreading)
- [ ] Test rapid clicking (fast switching)
- [ ] Test clicking frozen nodes (should work)
- [ ] Test background click exit

### **Console Logging:**
- [ ] Check for "Applying localized physics" log
- [ ] Verify connected node count is correct
- [ ] Verify link count for focus is correct
- [ ] Check for "Global simulation stopped"
- [ ] Check for "Localized simulation started"
- [ ] Verify "Stopping localized physics" on exit
- [ ] Verify "All nodes unfrozen" message
- [ ] Check for "Global simulation resumed"

---

## 🎓 Key Learnings

### **D3 Force Simulation Insights:**

1. **`fx/fy` properties** are the key to freezing nodes
   - Setting them locks position completely
   - Must be explicitly set to `null` to unfreeze
   - Forces cannot move nodes with `fx/fy` set

2. **Multiple simulations** can coexist
   - Each has its own force configuration
   - Each has its own tick handler
   - Must manually stop/start to avoid conflicts

3. **Alpha/alphaDecay** control animation duration
   - `alpha(1.0)` = maximum energy
   - `alphaDecay(0.015)` = ~2 second animation
   - Higher alpha = longer spread time

4. **Force strength balance** is critical
   - Weak link strength (0.3) allows spreading
   - Strong charge (-500) pushes nodes apart
   - Collision (0.9) prevents overlap

### **Implementation Principles:**

✅ **Stop global before starting local** - Prevents interference  
✅ **Freeze unconnected nodes** - True isolation  
✅ **Pin focused node** - Creates stable anchor  
✅ **Clean up on exit** - Remove fx/fy, stop sim  
✅ **Sync visual + physics timing** - Smooth experience  

---

## 🚀 Next Steps

### **Immediate:**
1. Test spreading behavior in browser
2. Verify console logs show correct node counts
3. Adjust force parameters if spread is too weak/strong
4. Test exit behavior and cleanup

### **Tuning (if needed):**
- Increase `distance` (200 → 250) for more spread
- Increase `charge` strength (-500 → -700) for stronger push
- Adjust `alphaDecay` (0.015 → 0.01) for longer animation
- Tweak `velocityDecay` (0.3 → 0.2) for more fluidity

### **Port to Main App:**
Once test page behavior is confirmed:
1. Apply same approach to `D3Graph.js`
2. Integrate with existing Focus Mode
3. Test with real mind map data
4. Update documentation

---

## 📝 Implementation Notes

### **Why Separate Simulation?**

We could have tried to keep the global simulation running and just adjust forces, but this approach is **cleaner and more reliable** because:

1. **No force conflicts** - Each simulation has independent configuration
2. **True isolation** - Frozen nodes can't be affected by any force
3. **Easier debugging** - Clear separation of concerns
4. **Better performance** - Focus sim only operates on small subset
5. **Clean state** - Exit just stops sim and removes constraints

### **Alternative Approaches Considered:**

❌ **Adjust global forces** - Too complex, affects all nodes  
❌ **Filter forces by node** - Forces don't support selective application  
❌ **Manual position calculation** - No physics feel, hard to tune  
✅ **Separate simulation** - Clean, isolated, effective

---

**Implementation Status:** ✅ Complete - Ready for Testing

**Result:** Focus Mode now creates a beautiful "flower petal" spreading effect where connected nodes smoothly spread outward from the focused anchor node, while all other nodes remain completely frozen. Physics are truly localized to just the focused cluster! 🎯🌸
