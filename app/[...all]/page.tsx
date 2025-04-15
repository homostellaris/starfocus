import dynamic from 'next/dynamic'

// See docs/disabling-ssr.md
const LazyApp = dynamic(() => import('../../components/App'), {
	ssr: false,
})

// TODO: See if individual routes with static data fetching can be used instead.
export async function generateStaticParams() {
	return [
		{ all: ['home'] },
		{ all: ['constellation'] },
		{ all: ['settings'] },
		{ all: ['test'] },
		{
			all: ['/icon.png'],
		},
	]
}

export default function Page() {
	return <LazyApp />
}
