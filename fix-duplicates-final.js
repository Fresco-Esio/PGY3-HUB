const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.js', 'utf8');

// Remove the entire duplicate section after "Exit early without updating positions"
// and replace with clean version
const pattern = /console\.log\('✅ Realignment cancelled due to user interaction'\);\s*return; \/\/ Exit early without updating positions\s*}\s*console\.log\('✅ Force layout settled - saving positions'\);[\s\S]*?console\.log\('✅ Realignment complete - letting auto-save persist positions'\);\s*};/;

const replacement = `console.log('✅ Realignment cancelled due to user interaction');
        return; // Exit early without updating positions
      }
      
      console.log('✅ Realignment settling - finalizing positions');
      
      // Remove the radial force now that layout is complete
      sim.force('radial', null);
      
      // Update D3's position tracking
      if (window.d3PrevPositions) {
        allNodes.forEach(node => {
          window.d3PrevPositions.current.set(node.id, { x: node.x, y: node.y });
        });
        console.log('💾 D3 position tracking updated');
      }
      
      // Clear flags immediately - no React state update needed
      window.isCustomRealigning = false;
      window.dragStartedDuringRealign = false;
      window.realignmentStartTime = null;
      
      console.log('✅ Realignment complete - nodes stabilized');
    };`;

const before = content.length;
content = content.replace(pattern, replacement);
const after = content.length;

if (before === after) {
  console.log('❌ Pattern did not match - no changes made');
  console.log('Searching for the problem area...');
  
  const searchPattern = /Realignment cancelled due to user interaction/;
  const match = content.match(searchPattern);
  if (match) {
    const index = content.indexOf(match[0]);
    console.log('Found at character position:', index);
    console.log('Context:', content.substring(index - 100, index + 500));
  }
} else {
  fs.writeFileSync('frontend/src/App.js', content, 'utf8');
  console.log(`✅ Fixed duplicate code blocks (removed ${before - after} characters)`);
  console.log('   Cleaned up onSimulationEnd function');
}
