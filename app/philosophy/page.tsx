import Link from 'next/link'

export default function Page() {
	return (
		<div className="bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)] min-h-screen">
			<header>
				<h1 className="pt-4 mb-12 text-center text-white font-bold uppercase text-9xl font-display [font-palette:--redshift]">
					Philosophy
				</h1>
			</header>
			<main className="pt-4 mx-auto space-y-4 font-sans text-lg text-white max-w-prose">
				<p>
					In this age of constant distraction and information overload we need
					more thoughtfully designed apps that learn what is important to us and
					help us to stay focused.
				</p>
				<p>
					A key design goal of Starfocus is to embrace our imperfect human
					nature. Rigid scheduling of todos is error-prone and demotivating.
					Never-ending backlogs of todos are anxiety-inducing. We prefer
					goal-setting, brain-dumping, and space exploration!
				</p>
			</main>
			<footer>
				<nav>
					<ul className="fixed left-0 right-0 flex justify-center gap-4 mx-auto text-xl font-normal text-blue-300 underline bottom-4">
						<li>
							<Link href="/philosophy">Philosophy</Link>
						</li>
						<li>
							<a
								href="https://discord.gg/TYHCj2VhpD"
								title="Join the Discord community to discuss ideas for the product and just generally nerd out on productivity and space exploration 🚀"
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
