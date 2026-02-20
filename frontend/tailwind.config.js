/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8E1', 100: '#FFECB3', 200: '#FFE082', 300: '#FFD54F',
          400: '#FFCA28', 500: '#F59E0B', 600: '#D97706', 700: '#B45309',
          800: '#92400E', 900: '#78350F',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
