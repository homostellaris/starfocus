import Link from 'next/link'
import Register from './Register'

export default function Contact() {
	return (
		<>
			<div className="text-center">
				<Register />
			</div>
			<div className="flex items-center gap-4">
				<Separator character="⋆" />
				<Link
					href="/home"
					className="font-bold text-white underline"
				>
					Try it!
				</Link>
				<Separator character="⋆" />
			</div>
			<div className="flex items-center justify-center flex-grow gap-4 text-center">
				<Link
					href="/roadmap"
					className="text-white underline"
				>
					Roadmap
				</Link>
				<Separator />
				<a
					href="https://discord.gg/TYHCj2VhpD"
					className="text-white underline"
					title="Join the Discord community to discuss ideas for the product and just generally nerd out on productivity and space exploration 🚀"
					target="_blank"
					rel="noopener noreferrer"
				>
					Discord
				</a>
				<Separator />
				<a
					href="https://github.com/astrochoric/starfocus/discussions"
					className="text-white underline"
					title="Create a GitHub account and join our discussions where you can vote on feature ideas and provide more detailed feedback 💡"
					target="_blank"
					rel="noopener noreferrer"
				>
					GitHub
				</a>
				<Separator />
				<a
					href="https://twitter.com/starfocusapp"
					className="text-white underline"
					title="Follow us on Twitter for the latest updates as well as random thoughts on productivity and space explortation"
					target="_blank"
					rel="noopener noreferrer"
				>
					Twitter
				</a>
			</div>
		</>
	)
}

function Separator({ character = '·' }) {
	return <span className="text-3xl text-white">{character}</span>
}
