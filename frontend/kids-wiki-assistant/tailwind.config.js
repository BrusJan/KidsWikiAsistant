/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'system-ui', 'sans-serif'],
      },
      colors: {
        bubble: '#f1f7fa',
        primary: '#f7a517',
        background: '#f3d8bd',
        'input-border': '#d2d5c0',
        text: '#333',
      }
    },
  },
  plugins: [],
}

