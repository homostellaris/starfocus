import { DependencyList, useEffect } from 'react'

export default function useKeyboardShortcuts(
	handler: (event: KeyboardEvent) => void,
	dependencies: DependencyList,
) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.target !== document.body) return

			return handler(event)
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [dependencies, handler])
}
