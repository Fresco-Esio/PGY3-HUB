# 🎨 Mind Map App – Visual & Interaction Design Style Guide  
_Last updated: July 2025_

## 🧭 Design Philosophy

The Mind Map app is **not a generic task manager**—it is a **thinking space** for psychiatry residents to visually organize knowledge. Its design is rooted in **tactile, intuitive interaction** and a **graphic arts-inspired aesthetic**. Every element should feel intentional, elegant, and psychologically engaging.

---

## 🧱 Core Visual Principles

### 1. Tactile Minimalism
- Canvas should feel like a physical surface (e.g., sketchpad, whiteboard).
- Light grid/radial dot background preferred over flat white.
- Use shadows and elevation subtly to imply depth.
- Dragging nodes should have slight inertia or weight (easing, not snapping).

### 2. Shape as Identity (Per Node Type)
Each node type should have a visually distinct shape:

| Node Type   | Shape Description                          | Purposeful Feel                         |
|-------------|---------------------------------------------|------------------------------------------|
| **Case**     | Rounded rectangle/card                     | Like a patient folder or medical chart   |
| **Topic**    | Circle or orb                              | Abstract, thematic                       |
| **Literature** | Slender vertical rectangle with tab top | Like a journal tab or spine of a book    |
| **Task**     | Flag or banner shape                       | Signals action and urgency               |

> Shapes should scale naturally with limited text. Keep titles short (≤ 30 characters ideal).

### 3. Motion as Feedback
Use subtle animation to provide context without distraction:
- Node creation: `fade-in + rise`
- Hover: `soft glow` or `border highlight`
- Edge drawing: `smooth bezier curve flow`
- Node drag: `ease-in-out` transition with scale constraint

---

## 🎨 Typography & Color System

### Fonts
- **Primary Font:** `IBM Plex Sans` or `Inter` (clean, warm, modern)
- **Font Scale:**
  - Node Title: `16px – bold`
  - Sub-info (e.g., tags, dates): `13px – medium`
  - Modal/body content: `14–15px – regular`

### Color Palette

| Semantic Group | Role                     | Suggested Hue       |
|----------------|--------------------------|---------------------|
| **Case**       | Core clinical info       | Cool Slate Blue     |
| **Topic**      | Conceptual hubs          | Soft Emerald Green  |
| **Literature** | Academic references      | Deep Plum           |
| **Task**       | Action items             | Golden Ochre        |

- Background: `#F7F9FC` or soft off-white
- Accent: Limited use of bright colors (e.g., orange for overdue)
- Connections: Soft gray or node-hued, 40–60% opacity

---

## 🧠 Emotional & Cognitive Tone

| Goal                  | Design Implication                              |
|-----------------------|--------------------------------------------------|
| **Curiosity**         | Interactions feel exploratory, not prescriptive |
| **Creative Focus**    | No pop-ups or alerts unless deeply necessary    |
| **Visual Ownership**  | Layouts must remain user-defined (sticky fx/fy) |

> The app should *feel like you made it*, not like you’re just using it.

---

## 🔧 Developer Guidelines

- **Node Types:** Hardcode shape logic per node type class.
- **Text Truncation:** Apply title length constraints or dynamic scaling to preserve layout.
- **Sticky Layout:** Use `fx`/`fy` in layout engine and persist between sessions.
- **Component Structure:** All visual elements should be styled with clear CSS classes or styled-components named semantically (`.node-task`, `.node-case`, etc.).
- **Avoid:** Flat Bootstrap-style UIs, high-saturation palettes, harsh box shadows, or clinical grayscale tones.

---

## 📁 How to Use This Guide

- Treat this file as a source-of-truth when adjusting visuals or building new components.
- Before implementing a new visual behavior or interaction, check:
  1. Does it **feel tactile**?
  2. Does it **express the node’s identity**?
  3. Is it **intuitively discoverable**?
  4. Does it **respect the user's layout choices**?
