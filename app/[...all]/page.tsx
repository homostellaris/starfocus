import App from './App'

export async function generateStaticParams() {
	return [
		{ all: ['home'] },
		{ all: ['constellation'] },
		{ all: ['settings'] },
		{ all: ['test'] },
	]
}

export default function Page() {
	return <App />
}
