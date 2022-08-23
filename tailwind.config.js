/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'planets': "url('/planets.jpg')",
        'supernova': "url('/supernova - radial.png')",
      }
    },
    fontSize: {
      'xs': 'clamp(.5rem, 0.625vw, .75rem)',
      'sm': '.875rem',
      'base': '1rem',
      'lg': 'clamp(0.75rem, 1.25vw, 1.25rem)',
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
