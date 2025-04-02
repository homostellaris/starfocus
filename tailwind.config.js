/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./app/**/*.{js,ts,jsx,tsx}',
		'./pages/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}',
	],
	darkMode: 'media',
	theme: {
		extend: {
			backgroundImage: {
				planets: "url('/planets.jpg')",
				supernova: "url('/supernova - radial.png')",
			},
			fontFamily: {
				mono: ['var(--font-jura)'],
				display: [
					'var(--font-honk)',
					{
						fontVariationSettings: '"MORF" 15, "SHLN" 50',
					},
				],
			},
		},
		// TODO: Use fluid font sizes
		// fontSize: {
		//   'xs': 'clamp(.5rem, .625vw, .75rem)',
		//   'sm': 'clamp(.75rem, .875vw, .875rem)',
		//   'base': '1rem',
		//   'lg': 'clamp(.75rem, 1.25vw, 1.25rem)',
		//   'xl': 'clamp(1rem, 1.5vw, 1.25rem)',
		//   '2xl': 'clamp(1rem, 2vw, 1.5rem)',
		//   '3xl': 'clamp(1.875rem, 3vw, 2rem)',
		//   '4xl': 'clamp(1.25rem, 3vw, 2.25rem)',
		//   '5xl': 'clamp(2.5rem, 5vw, 5rem)',
		//   '6xl': 'clamp(3rem, 7vw, 7rem)',
		// },
	},
	plugins: [],
}
