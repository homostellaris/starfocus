import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Starfocus',
		short_name: 'Starfocus',
		description: 'The todo list for our future',
		start_url: '/home',
		display: 'standalone',
		background_color: '#fff',
		theme_color: '#fff',
		icons: [
			{
				src: '/logo.png',
				sizes: '400x400',
				purpose: 'any',
			},
		],
	}
}
