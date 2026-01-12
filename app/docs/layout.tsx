import Nav from '../../components/common/Nav'
import { DocsSidebar } from './DocsSidebar'

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
			<div className="flex gap-8 px-4 mx-auto max-w-7xl">
				<DocsSidebar />

				<main className="flex-1 min-w-0 pb-16 font-sans text-lg text-white">
					<div className="prose prose-invert max-w-none">{children}</div>
				</main>
			</div>

			<footer className="pb-8 mt-auto">
				<Nav />
			</footer>
		</div>
	)
}
