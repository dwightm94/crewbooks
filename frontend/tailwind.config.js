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
        surface: {
          50: '#FFFFFF', 100: '#F8FAFC', 200: '#F1F5F9', 300: '#E2E8F0',
          400: '#CBD5E1', 500: '#94A3B8', 600: '#64748B', 700: '#334155',
          800: '#1E293B', 900: '#0F172A', 950: '#020617',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
