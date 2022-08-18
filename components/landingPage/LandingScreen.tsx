import AppDemo from './AppDemo'
import HeroMessage from './HeroMessage'

export default function LandingScreen(props) {
	return (
		<section
			id="hello"
			className="relative flex h-[calc(100vh-4rem)] flex-col"
		>
			{/* <h1
			id="title"
			className="supernova text-center text-6xl font-extralight uppercase tracking-widest text-white"
		>
			Starfocus
		</h1> */}
			<h2
				id="title"
				className="supernova text-center text-5xl font-extralight uppercase tracking-widest text-white"
			>
				Starfocus
			</h2>
			<HeroMessage />
			<div className="left-0 right-0 m-auto w-10/12 flex-grow p-4">
				{/* Make this sticky too */}
				<AppDemo />
			</div>
		</section>
	)
}
