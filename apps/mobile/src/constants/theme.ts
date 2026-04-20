export const colors = {
  primary: '#1a73e8',
  primaryLight: '#e8f0fe',
  success: '#34a853',
  warning: '#fbbc04',
  danger: '#ea4335',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#202124',
  textSecondary: '#5f6368',
  border: '#dadce0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Minimum 44x44px tap targets per PRD accessibility requirements
export const minTapTarget = 44;

// Alarm button sizes - extra large for imperfect hands
export const alarmButtonSize = 80;
