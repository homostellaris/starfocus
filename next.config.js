const withMDX = require('@next/mdx')()
const withVercelToolbar = require('@vercel/toolbar/plugins/next')()

const nextConfig = withMDX({
	allowedDevOrigins: [
		'omarchy.tail29c7da.ts.net:8443',
		'omarchy.tail29c7da.ts.net:6603',
		'omarchy.tail29c7da.ts.net',
		'100.68.211.23:8443',
		'100.68.211.23:6603',
		'100.68.211.23',
		'192.168.178.124:6603',
		'192.168.178.124',
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

