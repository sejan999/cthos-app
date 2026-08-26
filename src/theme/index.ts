/**
 * Cthos Design System — STEP 2 foundation.
 *
 * Central theme tokens driving the modern dark-navy / soft-neon-blue
 * glassmorphism design language described in the master blueprint.
 */

export const palette = {
  // Base surface
  navy: {
    base: '#0B101E',
    raised: '#111730',
    overlay: '#151C38',
    stroke: '#1E2747',
  },
  // Soft neon blue accents
  neon: {
    primary: '#4A90E2',
    soft: '#6FA3F0',
    faint: 'rgba(74, 144, 226, 0.16)',
    glow: 'rgba(74, 144, 226, 0.55)',
  },
  // Semantic
  success: '#3DDC97',
  warning: '#FFB454',
  danger: '#FF5C72',
  text: {
    high: '#F4F7FF',
    mid: 'rgba(244, 247, 255, 0.72)',
    low: 'rgba(244, 247, 255, 0.42)',
  },
  onGlass: '#FFFFFF',
} as const;

export type Palette = typeof palette;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: '800' },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
} as const;

/** Shared glassmorphism surface styling — reused by cards & drawers. */
export const glass = {
  background: 'rgba(21, 28, 56, 0.55)',
  borderColor: 'rgba(111, 163, 240, 0.24)',
  borderWidth: 1,
  shadowColor: '#000000',
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
  backdropFilter: 'blur(16px)' as never,
} as const;

export const theme = { palette, spacing, radius, typography, glass } as const;
export type Theme = typeof theme;