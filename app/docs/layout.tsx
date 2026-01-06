import Link from 'next/link'

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<div className="min-h-screen bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)]">
			<header>
				<h1 className="mb-12 pt-4 text-center font-display text-9xl font-bold uppercase text-white [font-palette:--redshift]">
					Documentation
				</h1>
			</header>
			<div className="mx-auto flex max-w-7xl gap-8 px-4">
				{/* Sidebar Navigation */}
				<aside className="w-64 shrink-0">
					<nav className="sticky top-4">
						<ul className="space-y-2 text-blue-300">
							<li>
								<Link
									href="/docs"
									className="block rounded px-3 py-2 hover:bg-white/10"
								>
									Home
								</Link>
							</li>
							<li>
								<Link
									href="/docs/getting-started"
									className="block rounded px-3 py-2 hover:bg-white/10"
								>
									Getting Started
								</Link>
							</li>
							<li>
								<Link
									href="/docs/advanced"
									className="block rounded px-3 py-2 hover:bg-white/10"
								>
									Advanced Features
								</Link>
							</li>
						</ul>
					</nav>
				</aside>

				{/* Main Content */}
				<main className="min-w-0 flex-1 pb-16 font-sans text-lg text-white">
					<div className="prose prose-invert max-w-none">{children}</div>
				</main>
			</div>

			{/* Footer */}
			<footer>
				<nav>
					<ul className="fixed bottom-4 left-0 right-0 mx-auto flex justify-center gap-4 text-xl font-normal text-blue-300 underline">
						<li>
							<Link href="/">Home</Link>
						</li>
						<li>
							<Link href="/philosophy">Philosophy</Link>
						</li>
						<li>
							<a
								href="https://discord.gg/TYHCj2VhpD"
								title="Join the Discord community"
								target="_blank"
								rel="noopener noreferrer"
							>
								Discord
							</a>
						</li>
						<li>
							<a
								href="https://github.com/astrochoric/starfocus"
								target="_blank"
								rel="noopener noreferrer"
							>
								GitHub
							</a>
						</li>
					</ul>
				</nav>
			</footer>
		</div>
	)
}
