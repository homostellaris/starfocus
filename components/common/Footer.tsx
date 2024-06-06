import { ReactNode } from 'react'
import Contact from '../landingPage/Contact'

export default function Footer({
	children,
	display,
}: {
	children: ReactNode
	display: boolean
}) {
	return (
		<footer
			id="calls-to-action"
			className={`glass fixed inset-x-0 bottom-0 z-10 m-auto flex w-fit p-5 ${
				display ? 'translate-y-0' : 'translate-y-full'
			} flex-wrap items-center justify-center gap-4 overflow-hidden transition-transform rounded-t-2xl`}
		>
			{children}
		</footer>
	)
}
