const fs = require('fs');

// Read the file
let content = fs.readFileSync('frontend/src/App.js', 'utf8');

// Pattern to match the entire onSimulationEnd function
const pattern = /const onSimulationEnd = \(\) => \{[\s\S]*?};[\s\S]*?sim\.on\('end', onSimulationEnd\);/;

// New implementation without setMindMapData call
const replacement = `const onSimulationEnd = () => {
      sim.on('end', null);
      
      // Check if user dragged during realignment
      if (window.dragStartedDuringRealign) {
        console.log('⚠️ User dragged during realignment - skipping position sync');
        sim.force('radial', null);
        window.isCustomRealigning = false;
        window.dragStartedDuringRealign = false;
        window.realignmentStartTime = null;
        console.log('✅ Realignment cancelled');
        return;
      }
      
      console.log('✅ Realignment complete - hierarchical layout applied');
      sim.force('radial', null);
      
      // Update D3's position tracking for persistence
      if (window.d3PrevPositions) {
        allNodes.forEach(node => {
          window.d3PrevPositions.current.set(node.id, { x: node.x, y: node.y });
        });
      }
      
      // Clear flags - auto-save will persist positions naturally
      window.isCustomRealigning = false;
      window.dragStartedDuringRealign = false;
      window.realignmentStartTime = null;
    };
    
    sim.on('end', onSimulationEnd);`;

// Replace
content = content.replace(pattern, replacement);

// Write back
fs.writeFileSync('frontend/src/App.js', content, 'utf8');

console.log('✅ Fixed onSimulationEnd - removed setMindMapData call');
console.log('   This prevents D3Graph re-renders and snap-back issues');
