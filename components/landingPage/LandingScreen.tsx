import Image from 'next/image'
import AppDemo from './AppDemo'
import HeroMessage from './HeroMessage'
import appScreenshot from '../../public/the app - goals.png'

export default function LandingScreen(props) {
	return (
		<section
			id="landing-screen"
			className="flex h-full flex-col"
		>
			{/* <h1
			id="title"
			className="supernova text-center text-6xl font-extralight uppercase tracking-widest text-white"
		>
			Starfocus
		</h1> */}
			{/* <h2
				id="title"
				className="text-center text-5xl font-light uppercase tracking-wide text-white"
			>
				<span className="supernova">Starfocus</span>
			</h2> */}
			<HeroMessage />
			{/* Make this sticky too */}
			{/* <div className="left-0 right-0 m-auto my-4 w-full flex-grow overflow-hidden md:w-10/12">
				<AppDemo />
			</div> */}
			<div className="relative m-4 h-full w-full">
				<Image
					src={appScreenshot}
					className="p-4"
					alt="Screenshot of the desktop app"
					objectFit="contain"
					layout="fill"
				/>
			</div>
		</section>
	)
}
