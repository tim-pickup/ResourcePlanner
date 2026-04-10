/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'page': '#08090a',
        'panel': '#0f1011',
        'surface': '#191a1b',
        'elevated': '#28282c',
        'accent': '#5e6ad2',
        'accent-bright': '#7170ff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
