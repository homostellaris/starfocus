const withMDX = require('@next/mdx')()
const withVercelToolbar = require('@vercel/toolbar/plugins/next')()

const nextConfig = withMDX({
	devIndicators: false,
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

module.exports = withVercelToolbar(nextConfig)

