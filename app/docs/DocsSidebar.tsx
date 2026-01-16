'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { DocPage } from './getDocPages'

export function DocsSidebar({ pages }: { pages: DocPage[] }) {
	const detailsRef = useRef<HTMLDetailsElement>(null)

	const closeMenu = () => {
		if (detailsRef.current) {
			detailsRef.current.open = false
		}
	}

	return (
		<>
			<details ref={detailsRef} className="md:hidden group fixed bottom-4 right-4 z-50">
				<summary className="list-none p-3 rounded-full bg-blue-600 text-white shadow-lg cursor-pointer [&::-webkit-details-marker]:hidden">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 group-open:hidden"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 hidden group-open:block"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</summary>
				<nav className="fixed inset-0 -z-10 bg-black p-4 pt-8 overflow-y-auto">
					<ul className="space-y-1 text-blue-300">
						{pages.map(page => (
							<NavItem key={page.slug} page={page} onNavigate={closeMenu} />
						))}
					</ul>
				</nav>
			</details>

			<aside className="hidden md:block w-64 shrink-0">
				<nav className="sticky top-4">
					<ul className="space-y-1 text-blue-300">
						{pages.map(page => (
							<NavItem key={page.slug} page={page} />
						))}
					</ul>
				</nav>
			</aside>
		</>
	)
}

function NavItem({
	page,
	onNavigate,
}: {
	page: DocPage
	onNavigate?: () => void
}) {
	return (
		<li>
			{page.href ? (
				<Link
					href={page.href}
					className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10"
					onClick={onNavigate}
				>
					{page.title}
					{page.comingSoon && <ComingSoonBadge />}
				</Link>
			) : (
				<span className="flex items-center gap-2 px-3 py-1.5 text-blue-400/60">
					{page.title}
				</span>
			)}
			{page.children && (
				<ul className="ml-3 space-y-1 border-l border-white/10">
					{page.children.map(child => (
						<li key={child.slug}>
							{child.href ? (
								<Link
									href={child.href}
									className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/10 text-sm"
									onClick={onNavigate}
								>
									{child.title}
									{child.comingSoon && <ComingSoonBadge />}
								</Link>
							) : (
								<span className="flex items-center gap-2 px-3 py-1 text-blue-400/60 text-sm">
									{child.title}
								</span>
							)}
						</li>
					))}
				</ul>
			)}
		</li>
	)
}

function ComingSoonBadge() {
	return (
		<span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300/80">
			soon
		</span>
	)
}
