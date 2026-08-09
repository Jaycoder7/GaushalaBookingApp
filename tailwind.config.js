/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8ed',
          100: '#ffefd4',
          500: '#e97818',
          600: '#ce5c0e',
          700: '#a9430f',
        },
        earth: {
          50: '#f7f5f0',
          100: '#ebe6dc',
          700: '#51493d',
          900: '#2d2923',
        },
      },
      boxShadow: {
        soft: '0 20px 60px -28px rgba(45, 41, 35, 0.3)',
      },
    },
  },
  plugins: [],
};
