const fs = require('fs');

let content = fs.readFileSync('frontend/src/App.js', 'utf8');

// Remove duplicate radial force blocks
const before = content.length;

// Find and remove the duplicate section (lines containing duplicate radial force removal)
content = content.replace(
  /console\.log\('✅ Force layout settled - saving positions'\);\s*\/\/ Remove the radial force now that layout is complete\s*sim\.force\('radial', null\);\s*console\.log\('🔷 Removed radial force - nodes free to move'\);\s*\/\/ Update prevPositionsRef\s*\/\/ Remove the radial force now that layout is complete\s*sim\.force\('radial', null\);\s*console\.log\('.*? Removed radial force - returning to normal physics'\);\s*\/\/ Update prevPositionsRef/,
  `console.log('✅ Realignment complete - cleaning up');\n      sim.force('radial', null);\n      \n      // Update prevPositionsRef`
);

const after = content.length;

fs.writeFileSync('frontend/src/App.js', content, 'utf8');

console.log(`✅ Cleaned up duplicates (removed ${before - after} characters)`);
