const withMDX = require('@next/mdx')()

module.exports = withMDX({
	basePath: '',
	pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
				port: '',
				pathname: '**',
			},
		],
		unoptimized: true,
	},
	output: 'export',
	transpilePackages: [
		'@ionic/react',
		'@ionic/core',
		'@stencil/core',
		'ionicons',
	],
})
