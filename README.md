# OCR Application

## UI/UX Enhancements (Modern Theme & Animations)

This release updates the UI to a modern aesthetic with theme-aware tokens and rich, performant animations.

### What changed
- Global design tokens and motion variables in `src/index.css` (typography scale, brand palette, radii, easing, durations, elevation, gradients, and reduced-motion support).
- Light/Dark theming uses `:root.light`/`:root.dark` variables and persists via `ThemeProvider`.
- Page transitions: `RootLayout` wraps routed content with `framer-motion` `AnimatePresence` for blur/fade/slide transitions.
- Theme toggle: upgraded to animated toggle with spring motion and accessibility (`aria-label`, `aria-pressed`).
- Sidenav: glassmorphism surface, refined hover/active effects, soft glow indicator, smoother transitions.

### Files touched
- `src/index.css` – tokens, backgrounds, animation utilities, reduced motion support
- `src/components/common/ThemeToggle.tsx` – animated toggle using framer-motion
- `src/components/layout/RootLayout.tsx` – route enter/exit transitions
- `src/assets/styles/Layout.scss` – glassmorphism and motion polish for sidenav

### Performance & accessibility
- Animations use GPU-friendly transforms and `will-change` to minimize jank.
- Reduced motion respected via `prefers-reduced-motion`.
- Theme changes transition color/background only; heavy effects are avoided during theme switch.

### Theming
Theme is toggled via the button in the sidenav and stored in `localStorage`. The `ThemeProvider` applies `.light` or `.dark` to `documentElement` so CSS variables update without repaint flicker.

### Development notes
- Animations rely on `framer-motion` (already included in dependencies).
- Update or extend tokens in `:root` as needed; prefer using CSS vars in new components.
