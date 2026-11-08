/**
 * ChaiBreak / SkillDesign tokens.
 * Centralising the palette keeps every menu surface visually consistent.
 */
export const colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',

  primary: '#8D6E63',
  primaryDark: '#6D4C41',
  primarySoft: '#F3EBE4',
  primaryBorder: '#E6D8CC',

  text: '#3E2723',
  muted: '#8D8D8D',
  placeholder: '#A9A29C',

  veg: '#4CAF50',
  nonVeg: '#D32F2F',

  soldOut: '#3E2723',
  soldOutButtonBg: '#F1EFED',
  soldOutButtonBorder: '#DFDBD7',
  soldOutButtonText: '#A6A09B',

  divider: '#F0E9E2',
  switchTrackOff: '#D9D1CA',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const radii = {
  chip: 20,
  card: 16,
  input: 16,
  button: 9,
} as const;

export const cardShadow = {
  shadowColor: '#6D4C41',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
} as const;
