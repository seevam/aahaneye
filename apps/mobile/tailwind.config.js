/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          500: '#1a73e8',
          600: '#1557b0',
          700: '#104d99',
        },
        success: '#34a853',
        warning: '#fbbc04',
        danger: '#ea4335',
      },
    },
  },
  plugins: [],
};
