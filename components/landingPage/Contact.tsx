import Button from '../common/Button'
import Register from './Register'

export default function Contact() {
	return (
		<>
			<a
				href="https://discord.gg/TYHCj2VhpD"
				className="text-white"
				title="Join the Discord community to discuss ideas for the product and just generally nerd out on productivity and space exploration 🚀"
				target="_blank"
				rel="noopener noreferrer"
			>
				Discord
			</a>
			{/* <p className="text-slate-400 m-4">Beta coming soon</p> */}
			<Register />
			<a
				href="https://github.com/productivityguru/starfocus/discussions"
				className="w[10ch] text-white"
				title="Create a GitHub account and join our discussions where you can vote on feature ideas and provide more detailed feedback 💡"
				target="_blank"
				rel="noopener noreferrer"
			>
				GitHub
			</a>
		</>
	)
}
