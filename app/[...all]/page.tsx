import App from './App'

export async function generateStaticParams() {
	return [
		{ all: ['home'] },
		{ all: ['constellation'] },
		{ all: ['settings'] },
		{ all: ['test'] },
		{ all: ['dev'] },
		{ all: ['dev', 'components'] },
		{ all: ['dev', 'components', 'sync-status'] },
		{ all: ['dev', 'components', 'cloud-sync'] },
		{ all: ['dev', 'components', 'markdown-sync'] },
		{ all: ['dev', 'components', 'star-roles'] },
		{ all: ['dev', 'components', 'star-points'] },
		{ all: ['dev', 'components', 'starship-trajectory'] },
		{ all: ['dev', 'components', 'pulse-graph'] },
		{ all: ['dev', 'components', 'mood-player'] },
		{ all: ['dev', 'components', 'duplicate-detector'] },
		{ all: ['dev', 'theme'] },
	]
}

export default function Page() {
	return <App />
}
