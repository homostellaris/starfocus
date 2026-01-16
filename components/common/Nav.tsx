import Link from 'next/link'

export default function Nav() {
	return (
		<nav>
			<ul className="flex justify-center gap-4 mx-auto mt-auto font-mono text-xl font-normal text-blue-300 underline w-fit">
				<li>
					<Link href="/docs/get-started/quickstart">Docs</Link>
				</li>
				<li>
					<Link href="/privacy">Privacy</Link>
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
	)
}
