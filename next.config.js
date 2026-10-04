const withMDX = require('@next/mdx')()

module.exports = withMDX({
	allowedDevOrigins: [
		'omarchy.tail29c7da.ts.net:8443',
		'omarchy.tail29c7da.ts.net',
		'localhost:6603',
		'127.0.0.1:6603',
	],
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
