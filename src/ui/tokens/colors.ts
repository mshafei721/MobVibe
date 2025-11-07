const primary = {
  50: '#E3F2FD',
  100: '#BBDEFB',
  200: '#90CAF9',
  300: '#64B5F6',
  400: '#42A5F5',
  500: '#2196F3',
  600: '#1E88E5',
  700: '#1976D2',
  800: '#1565C0',
  900: '#0D47A1',
};

const secondary = {
  50: '#F3E5F5',
  100: '#E1BEE7',
  200: '#CE93D8',
  300: '#BA68C8',
  400: '#AB47BC',
  500: '#9C27B0',
  600: '#8E24AA',
  700: '#7B1FA2',
  800: '#6A1B9A',
  900: '#4A148C',
};

const success = {
  50: '#E8F5E9',
  100: '#C8E6C9',
  200: '#A5D6A7',
  300: '#81C784',
  400: '#66BB6A',
  500: '#4CAF50',
  600: '#43A047',
  700: '#388E3C',
  800: '#2E7D32',
  900: '#1B5E20',
};

const error = {
  50: '#FFEBEE',
  100: '#FFCDD2',
  200: '#EF9A9A',
  300: '#E57373',
  400: '#EF5350',
  500: '#F44336',
  600: '#E53935',
  700: '#D32F2F',
  800: '#C62828',
  900: '#B71C1C',
};

const warning = {
  50: '#FFF3E0',
  100: '#FFE0B2',
  200: '#FFCC80',
  300: '#FFB74D',
  400: '#FFA726',
  500: '#FF9800',
  600: '#FB8C00',
  700: '#F57C00',
  800: '#EF6C00',
  900: '#E65100',
};

const info = {
  50: '#E1F5FE',
  100: '#B3E5FC',
  200: '#81D4FA',
  300: '#4FC3F7',
  400: '#29B6F6',
  500: '#03A9F4',
  600: '#039BE5',
  700: '#0288D1',
  800: '#0277BD',
  900: '#01579B',
};

const neutral = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  950: '#121212',
};

export const colorsLight = {
  primary,
  secondary,
  success,
  error,
  warning,
  info,
  neutral,

  text: {
    primary: neutral[900],
    secondary: neutral[700],
    tertiary: neutral[500],
    disabled: neutral[400],
    inverse: neutral[50],
  },

  background: {
    base: '#FFFFFF',
    subtle: neutral[50],
  },

  surface: {
    0: '#FFFFFF',
    1: neutral[50],
    2: neutral[100],
    3: neutral[200],
  },

  border: {
    subtle: neutral[200],
    base: neutral[300],
    strong: neutral[400],
    primary: primary[500],
    success: success[500],
    error: error[500],
    warning: warning[500],
  },

  code: {
    background: '#1E1E1E',
    text: '#D4D4D4',
  },
};

export const colorsDark = {
  primary,
  secondary,
  success,
  error,
  warning,
  info,
  neutral,

  text: {
    primary: neutral[50],
    secondary: neutral[300],
    tertiary: neutral[500],
    disabled: neutral[600],
    inverse: neutral[900],
  },

  background: {
    base: neutral[950],
    subtle: neutral[900],
  },

  surface: {
    0: neutral[900],
    1: neutral[800],
    2: neutral[700],
    3: neutral[600],
  },

  border: {
    subtle: neutral[800],
    base: neutral[700],
    strong: neutral[600],
    primary: primary[400],
    success: success[400],
    error: error[400],
    warning: warning[400],
  },

  code: {
    background: '#0D0D0D',
    text: '#D4D4D4',
  },
};

export const colors = colorsLight;
