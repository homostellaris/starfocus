import dynamic from 'next/dynamic'

// TODO: Find out if this is necessary to be compatible with Ionic & Capacitor
const App = dynamic(() => import('../../components/AppShell'), {
	ssr: false,
})

export default function Page() {
	return <App />
}
