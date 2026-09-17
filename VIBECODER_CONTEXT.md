# Money Weather: Vibecoder Context

Welcome, fellow Vibecoder! This file contains all the necessary context regarding the **Money Weather** prototype app to help you seamlessly continue development.

## 📱 Project Overview
"Money Weather" is a fintech mobile prototype designed to help users track their weekly UPI spending boundary against their safe-to-use salary balance. It uses a metaphorical "weather" system (Stable, Tightening, Under Pressure) to describe the user's financial pace.

## 🛠 Tech Stack
- **Framework:** React / Next.js (using the Vinext starter)
- **Styling:** Pure CSS (Vanilla CSS) in `app/globals.css`. 
  - *Note:* We rely entirely on custom CSS classes and CSS variables for styling. Tailwind is technically in the project but the UI is custom-built via pure CSS to maintain absolute control over the premium design.
- **Icons:** `lucide-react`
- **UI Components:** Some Radix/Shadcn primitives (`@/components/ui/accordion`, `slider`, `sheet`) are used but heavily customized via CSS.

## 💎 UI/UX Pro Max Design System
The app recently underwent a "UI/UX Pro Max" visual upgrade. **Do not break these visual rules.**

### 1. Typography (CRITICAL)
- **Primary Font:** **PP Neue Montreal** (Self-hosted via `@font-face` in `globals.css`).
- **Available Weights:** 
  - `100` (Thin)
  - `400` (Book / Normal)
  - `400` (Italic)
  - `500` (Medium)
  - `600` (SemiBold Italic)
  - `700` (Bold)
- *Important:* **DO NOT** use intermediate weights like `450`, `550`, `650`, or `800`. The browser will faux-bold/faux-light them and ruin the rendering. Only use `100`, `400`, `500`, and `700`.
- **Kerning/Tracking:** PP Neue Montreal has naturally wider metrics than Inter. Letter-spacing has been meticulously calibrated. If you add new text elements, ensure you use similar optical adjustments:
  - Hero text (`h1`, `h2`): `-0.02em` to `-0.035em`
  - Body text: `0.005em`
  - Uppercase labels: `0.12em` to `0.16em`

### 2. Color Palette & Surfaces
- **Background:** `#050507` (Deep dark, not pure black)
- **Accent:** `--aqua` (`#00ffcc`) for primary actions, pacing, and positive states.
- **Warm Accent:** `--accent-warm` (`#ffcc66`) for estimates and warnings.
- **Surfaces (Depth System):** Cards and panels use a layered depth system (`--surface-0` through `--surface-3`) to create elevation.
- **Glassmorphism:** Key elements (Top bar, Bottom nav, Notice panels, Estimate panels) use `backdrop-filter: blur()` combined with semi-transparent backgrounds (`--surface-glass`).

### 3. Micro-animations & Effects
- The app relies heavily on subtle glow effects using `box-shadow` (e.g., `--shadow-aqua`).
- **Atmosphere:** The `.atmosphere-glow` element has a continuous 6-second floating animation (`atmosphere-float`).
- **Interactive States:** Buttons and route panels have spring-like press animations (`transform: scale(0.97)` on `:active`) and hover glows.

## 🏗 Code Structure
- **`app/page.tsx`:** Contains the entire prototype flow managed via a local `screen` state index (0 to 8). It conditionally renders different screens (Salary, Commitments, Boundary, Home, Changed, Options, Review) within a `.phone` frame.
- **`app/globals.css`:** Contains all the styling. It is organized logically into sections (Tokens, Reset, Shared Components, and individual screen sections).

## 🚀 Guidelines for Future Updates
1. **Preserve Interactions:** If you are asked to update the UI, do not break the underlying React state logic (`setScreen`, `setBoundary`, etc.).
2. **CSS Specificity:** When adding new UI elements, follow the existing BEM-like class naming conventions and add your styles to the appropriate section in `globals.css`.
3. **Typography First:** Always respect the available PP Neue Montreal weights. If something looks "off", it's probably a rogue `font-weight: 600` on a non-italic element.

Good luck, and keep the vibes immaculate! ✨
