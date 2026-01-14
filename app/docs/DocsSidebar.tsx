import Link from 'next/link'
import { DocPage, getDocPages } from './getDocPages'

export function DocsSidebar() {
	const pages = getDocPages()

	return (
		<aside className="w-64 shrink-0">
			<nav className="sticky top-4">
				<ul className="space-y-1 text-blue-300">
					{pages.map(page => (
						<NavItem key={page.slug} page={page} />
					))}
				</ul>
			</nav>
		</aside>
	)
}

function NavItem({ page }: { page: DocPage }) {
	return (
		<li>
			{page.href ? (
				<Link
					href={page.href}
					className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/10"
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
