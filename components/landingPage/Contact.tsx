import Register from './Register'

export default function Contact() {
	return (
		<>
			<div className="m-auto text-center">
				<Register />
			</div>
			<div className="m-4 flex flex-grow items-center justify-between gap-4 text-center">
				<Separator />
				<a
					href="https://discord.gg/Gdywcwcu"
					className="text-white"
					title="Join the Discord community to discuss ideas for the product and just generally nerd out on productivity and space exploration 🚀"
					target="_blank"
					rel="noopener noreferrer"
				>
					Discord
				</a>
				<Separator />
				<a
					href="https://github.com/productivityguru/starfocus/discussions"
					className="w[10ch] text-white"
					title="Create a GitHub account and join our discussions where you can vote on feature ideas and provide more detailed feedback 💡"
					target="_blank"
					rel="noopener noreferrer"
				>
					GitHub
				</a>
				<Separator />
				<a
					href="https://twitter.com/starfocusapp"
					className="w[10ch] text-white"
					title="Follow us on Twitter for the latest updates as well as random thoughts on productivity and space explortation"
					target="_blank"
					rel="noopener noreferrer"
				>
					Twitter
				</a>
				<Separator />
			</div>
		</>
	)
}

function Separator() {
	return <span className="text-3xl text-white">·</span>
}
