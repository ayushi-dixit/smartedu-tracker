/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6fb',
          100: '#e6eaf5',
          200: '#c9d2e8',
          300: '#a2b0d6',
          400: '#7484bd',
          500: '#54619f',
          600: '#414c82',
          700: '#333c68',
          800: '#232a49',
          900: '#171b32',
          950: '#0e1122',
        },
        risk: {
          low: '#1E8A5F',
          lowBg: '#E7F5EE',
          medium: '#B8860B',
          mediumBg: '#FBF1DE',
          high: '#C0392B',
          highBg: '#FCEAE8',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Lora"', 'serif'],
      },
    },
  },
  plugins: [],
};
