import Link from 'next/link'
import { getDocPages } from './getDocPages'

export function DocsSidebar() {
	const pages = getDocPages()

	return (
		<aside className="w-64 shrink-0">
			<nav className="sticky top-4">
				<ul className="space-y-2 text-blue-300">
					{pages.map(page => (
						<li key={page.slug}>
							<Link
								href={page.href}
								className="block px-3 py-2 rounded hover:bg-white/10"
							>
								{page.title}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</aside>
	)
}
