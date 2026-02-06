import { useState } from 'react'

function getDebugParam() {
	if (typeof window === 'undefined') return ''
	return new URLSearchParams(window.location.search).get('debug') ?? ''
}

export function useDebug() {
	const [debug, setDebug] = useState(getDebugParam)
	return [debug, setDebug]
}
