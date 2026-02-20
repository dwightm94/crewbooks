/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24',
          500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E',
        },
        navy: {
          300: '#8899A6', 400: '#627D98', 500: '#486581',
          600: '#334E68', 700: '#243B53', 800: '#102A43', 900: '#0B1120',
        },
      },
    },
  },
  plugins: [],
};
