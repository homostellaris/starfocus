const fs = require('fs')
const path = require('path')
const withMDX = require('@next/mdx')()

function ensureWorktreeVercelProjectConfig() {
	const localVercelProjectPath = path.join(
		process.cwd(),
		'.vercel',
		'project.json',
	)
	if (fs.existsSync(localVercelProjectPath)) {
		return
	}

	const candidateRoots = [
		process.cwd(),
		path.resolve(process.cwd(), '..', '..'),
	]

	for (const rootDir of candidateRoots) {
		const projectJsonPath = path.join(rootDir, '.vercel', 'project.json')
		if (fs.existsSync(projectJsonPath)) {
			fs.mkdirSync(path.dirname(localVercelProjectPath), { recursive: true })
			fs.copyFileSync(projectJsonPath, localVercelProjectPath)
			return
		}

		const repoJsonPath = path.join(rootDir, '.vercel', 'repo.json')
		if (fs.existsSync(repoJsonPath)) {
			try {
				const repoConfig = JSON.parse(fs.readFileSync(repoJsonPath, 'utf8'))
				const firstProject =
					Array.isArray(repoConfig.projects) && repoConfig.projects[0]
				if (
					firstProject &&
					firstProject.id &&
					(firstProject.orgId || repoConfig.orgId)
				) {
					fs.mkdirSync(path.dirname(localVercelProjectPath), {
						recursive: true,
					})
					fs.writeFileSync(
						localVercelProjectPath,
						JSON.stringify(
							{
								projectId: firstProject.id,
								orgId: firstProject.orgId || repoConfig.orgId,
							},
							null,
							2,
						),
					)
					return
				}
			} catch {}
		}
	}
}

ensureWorktreeVercelProjectConfig()

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
	...(process.env.NODE_ENV === 'production' ? { output: 'export' } : {}),
	transpilePackages: [
		'@ionic/react',
		'@ionic/core',
		'@stencil/core',
		'ionicons',
	],
})

const toolbarEnabledConfig = withVercelToolbar(nextConfig)

module.exports = {
	...toolbarEnabledConfig,
	env: {
		...toolbarEnabledConfig.env,
		...(process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_OWNER_ID
			? {
					NEXT_PUBLIC_VERCEL_TOOLBAR_OWNER_ID:
						process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_OWNER_ID,
				}
			: {}),
		...(process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_PROJECT_ID
			? {
					NEXT_PUBLIC_VERCEL_TOOLBAR_PROJECT_ID:
						process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_PROJECT_ID,
				}
			: {}),
		...(process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_BRANCH
			? {
					NEXT_PUBLIC_VERCEL_TOOLBAR_BRANCH:
						process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_BRANCH,
				}
			: {}),
		...(process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_TOKEN
			? {
					NEXT_PUBLIC_VERCEL_TOOLBAR_TOKEN:
						process.env.NEXT_PUBLIC_VERCEL_TOOLBAR_TOKEN,
				}
			: {}),
	},
}
