'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DocsPage() {
	const router = useRouter()

	useEffect(() => {
		router.replace('/docs/get-started/quickstart')
	}, [router])

	return null
}
