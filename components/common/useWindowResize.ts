import debounce from 'debounce'
import { useLayoutEffect, useState } from 'react'

export function useWindowSize() {
	const [size, setSize] = useState([0, 0])

	useLayoutEffect(() => {
		const updateSize = debounce(() => {
			setSize([window.innerWidth, window.innerHeight])
		}, 200)

		window.addEventListener('resize', updateSize)
		updateSize()

		return () => window.removeEventListener('resize', updateSize)
	}, [])

	return size
}
