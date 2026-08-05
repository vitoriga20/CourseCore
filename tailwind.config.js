/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        practice: {
          accent: '#16A34A',
          'accent-2': '#2DD288',
          bg: '#0E0E16',
          card: '#14141F',
          'card-hover': '#1E1E2E',
          text: '#F5F5F7',
          muted: '#8B8B96',
          border: '#2A2A3A',
        }
      }
    }
  },
  plugins: []
};
