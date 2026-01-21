'use client'

import dynamic from 'next/dynamic'

import '@ionic/react/css/structure.css'

const LazyApp = dynamic(() => import('../../components/App'), {
	ssr: false,
})

export default function App() {
	return <LazyApp />
}
