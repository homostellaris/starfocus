import Image from 'next/image'
import Nav from '../../components/common/Nav'
import { DocsSidebar } from './DocsSidebar'
import { getDocPages } from './getDocPages'
import logo from '../icon.png'
import Link from 'next/link'

export default function DocsLayout({
	children,
}: {
	children: React.ReactNode
}) {
	const pages = getDocPages()

	return (
		<div className="min-h-screen bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)]">
			<div className="px-4 py-2 mx-auto max-w-7xl">
				<header className="flex items-center mb-6 md:mb-12">
					{/* <Link href="/">
						<Image
							alt="Starfocus logo"
							className="object-contain w-12 h-12 py-4 mr-0 shrink-0"
							src={logo}
						/>
					</Link> */}
					<h1 className="text-center font-display text-5xl md:text-9xl font-bold uppercase text-white [font-palette:--redshift] ml-auto mr-auto">
						Documentation
					</h1>
				</header>
				<div className="flex flex-col gap-4 md:flex-row md:gap-8">
					<DocsSidebar pages={pages} />

					<main className="flex-1 min-w-0 pb-16 font-sans text-lg text-white">
						<div className="prose prose-invert max-w-none">{children}</div>
					</main>
				</div>
				<footer className="pb-8 mt-auto">
					<Nav />
				</footer>
			</div>
		</div>
	)
}
