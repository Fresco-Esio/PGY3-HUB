# Physics Controls - User Guide

**Feature:** Live adjustable physics parameters for mind map visualization  
**Version:** v0.6.0+  
**Location:** Gear icon in top-right corner

---

## 🎯 Quick Start

1. **Open Controls:** Click the gear icon ⚙️ in the top-right corner
2. **Adjust Parameters:** Move sliders to find your preferred settings
3. **Save Settings:** Click "Save Settings" button (turns green on success)
4. **Done!** Settings will load automatically next time you open the app

---

## 🎛️ Available Parameters

### 🔵 Collision Settings

**Collision Radius** (20-100)
- Controls how far nodes stay apart
- **Higher = More spread out**
- **Lower = More compact**
- Default: 40

**Collision Strength** (0-1)
- How strongly nodes push away from each other
- **Higher = More forceful separation**
- **Lower = Softer boundaries**
- Default: 0.7

### 🟢 Link Settings

**Link Distance** (50-200)
- Target length of connection lines
- **Higher = Longer connections**
- **Lower = Shorter connections**
- Default: 120

**Link Strength** (0-1)
- How tightly connections pull nodes together
- **Higher = Rigid connections**
- **Lower = Flexible, organic movement**
- Default: 0.5

### 🟣 Simulation Dynamics

**Alpha Decay** (0.01-0.1)
- How fast the simulation settles down
- **Higher = Settles faster**
- **Lower = Takes longer to stabilize**
- Default: 0.0228

**Velocity Decay** (0.1-0.9)
- Friction/damping of node movement
- **Higher = More stable, less bouncy**
- **Lower = More bouncy, energetic**
- Default: 0.4

---

## 💡 Common Use Cases

### I want nodes more spread out
- ↑ Increase **Collision Radius** to 60-80
- ↑ Increase **Link Distance** to 150-180

### I want a tighter, more compact layout
- ↓ Decrease **Collision Radius** to 25-35
- ↓ Decrease **Link Distance** to 60-90

### My nodes are too bouncy/unstable
- ↑ Increase **Velocity Decay** to 0.6-0.8
- ↑ Increase **Alpha Decay** to 0.04-0.06

### I want more organic, flowing movement
- ↓ Decrease **Link Strength** to 0.2-0.4
- ↓ Decrease **Velocity Decay** to 0.2-0.3

### Nodes are overlapping
- ↑ Increase **Collision Strength** to 0.8-1.0
- ↑ Increase **Collision Radius** by 10-20

### Connections feel too rigid
- ↓ Decrease **Link Strength** to 0.2-0.3
- This allows more natural positioning

---

## 🔧 Tips & Tricks

### Experimentation
- **No risk!** You can always click "Reset" to restore defaults
- Try extreme values to understand each parameter's effect
- Adjust one parameter at a time to see its impact

### Finding Your Sweet Spot
1. Start with collision radius (affects overall spacing)
2. Then adjust link distance (affects connection length)
3. Fine-tune with strengths (affects how forces interact)
4. Finally adjust dynamics (affects settling behavior)

### Performance Considerations
- Higher collision radius = More calculations (slight performance impact)
- Lower alpha decay = Simulation runs longer (uses more CPU)
- For large graphs (50+ nodes), use moderate values

### Save Often
- Click "Save Settings" whenever you find a layout you like
- Settings are saved to your browser
- Each browser/device has its own saved settings

---

## 🎨 Preset Recommendations

### Clinical Case Study (Default)
- Collision Radius: 40
- Collision Strength: 0.7
- Link Distance: 120
- Link Strength: 0.5
- Alpha Decay: 0.0228
- Velocity Decay: 0.4

### Compact View (Many nodes)
- Collision Radius: 30
- Collision Strength: 0.8
- Link Distance: 80
- Link Strength: 0.6
- Alpha Decay: 0.04
- Velocity Decay: 0.6

### Spacious View (Visual clarity)
- Collision Radius: 60
- Collision Strength: 0.7
- Link Distance: 160
- Link Strength: 0.4
- Alpha Decay: 0.03
- Velocity Decay: 0.5

### Organic Flow (Aesthetic)
- Collision Radius: 45
- Collision Strength: 0.6
- Link Distance: 140
- Link Strength: 0.3
- Alpha Decay: 0.02
- Velocity Decay: 0.3

---

## 🐛 Troubleshooting

### Settings aren't saving
- **Check:** Browser localStorage is enabled
- **Try:** Different browser or incognito mode
- **Fix:** Click "Save Settings" after adjusting

### Simulation never settles
- **Cause:** Alpha decay too low or velocity decay too low
- **Fix:** Increase alpha decay to 0.04+

### Nodes flying off screen
- **Cause:** Forces too strong, physics enabled during drag
- **Fix:** Reset to defaults, ensure physics toggle is working

### Sliders not responding
- **Check:** Gear icon is clicked and panel is open
- **Try:** Refresh page and reopen controls
- **Report:** If issue persists, this is a bug

### Layout looks messy after adjusting
- **Quick fix:** Click "Reset" to restore working defaults
- **Alternative:** Try the preset recommendations above

---

## 🔐 Privacy & Storage

### Where are settings stored?
- In your browser's localStorage
- NOT sent to any server
- Local to your device/browser only

### What is stored?
- Just the 6 physics parameter values
- No personal data
- No tracking

### Clearing saved settings
- Click "Reset" button in Physics Controls
- Or clear your browser's site data

---

## 📞 Support

### Report Issues
If you encounter problems with Physics Controls:
1. Note which parameters you adjusted
2. Describe the unexpected behavior
3. Try clicking "Reset" first
4. Report in GitHub Issues if problem persists

### Feature Requests
Want more control? Ideas for improvements?
- Preset templates
- Import/export settings
- Visual preview of changes
- Per-node-type physics

Submit suggestions in GitHub Discussions!

---

**Remember:** Physics Controls are meant to help you customize the visualization to YOUR preferences. There's no "right" answer - just what works best for you! 🎯
