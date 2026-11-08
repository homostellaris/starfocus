const withMDX = require('@next/mdx')()
const withVercelToolbar = require('@vercel/toolbar/plugins/next')()

const nextConfig = withMDX({
	allowedDevOrigins: [
		'omarchy.tail29c7da.ts.net:*',
		'omarchy.tail29c7da.ts.net',
		'*.tail29c7da.ts.net:*',
		'*.tail29c7da.ts.net',
		'100.68.211.23:*',
		'100.68.211.23',
		'localhost:*',
		'127.0.0.1:*',
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

