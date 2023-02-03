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
		/* Currently don't have a way to keep this sticky and have a variable height without pushing the rest of the LandingScreen off the top of the page.
		 * So we're using flex-wrap with a fixed height so that when the screen width gets too small for the other links they wrap to the next row
		 * and effectively disappear because of the fixed height.
		 */
		<footer
			id="calls-to-action"
			className={`glass fixed inset-x-0 bottom-0 z-10 m-auto flex h-20 w-fit px-8 ${
				display ? 'translate-y-0' : 'translate-y-20'
			} flex-wrap items-center justify-center gap-8 overflow-hidden transition-transform md:rounded-t-2xl`}
		>
			{children}
		</footer>
	)
}
