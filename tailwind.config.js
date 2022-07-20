/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    fontSize: {
      'xs': '.75rem',
      'sm': '.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': 'clamp(1rem, 1.5vw, 1.25rem)',
      '2xl': 'clamp(1rem, 2vw, 1.5rem)',
      '3xl': '1.875rem',
      '4xl': 'clamp(1.25rem, 3vw, 2.25rem)',
      '5xl': '3rem',
      '6xl': 'clamp(3rem, 7vw, 7rem)',
    },
  },
  plugins: [],
}
