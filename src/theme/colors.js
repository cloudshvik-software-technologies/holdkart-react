// src/theme/colors.js
//
// Single source of truth for brand colors used in JS inline styles
// (style={{...}}). Mirrors the CSS custom properties in index.css —
// keep both in sync if a value ever changes.
//
// Two-color system:
//   blue   -> primary brand color (header, nav, "Add to Cart", links)
//   orange -> accent color (search/cart buttons, "Join" deal buttons,
//             promo highlights)
// Plus semantic colors (success/danger/warning) that are intentionally
// NOT tied to the brand palette — they're universal shopping conventions
// (red = discount/error, green = in-stock/success) shared by every
// competitor, so changing them hurts recognizability rather than helping.

export const COLORS = {
  blue:       '#2a5298',
  blueDark:   '#1e3c72',
  blueMid:    '#4f7ccc',
  bluePale:   '#eef2ff',

  orange:      '#FF6B00',
  orangeDark:  '#E85D04',

  text:    '#1f2937',
  muted:   '#6b7280',
  border:  '#e5e7eb',
  bg:      '#f4f6fa',
  white:   '#ffffff',

  success: '#16a34a',
  danger:  '#dc2626',
  warn:    '#ca8a04',
};

export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.blueDark})`,
  accent:  `linear-gradient(135deg, ${COLORS.orange}, ${COLORS.orangeDark})`,
  header:  `linear-gradient(135deg, ${COLORS.blueDark}, ${COLORS.blue})`,
};

export default COLORS;
