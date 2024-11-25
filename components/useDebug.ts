import { useEffect, useState } from 'react'

export function useDebug() {
	const [debug, setDebug] = useState('')
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const searchQuery = params.get('debug')
		if (searchQuery) {
			setDebug(searchQuery)
		}
	}, [])
	return [debug, setDebug]
}
