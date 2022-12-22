import Image from 'next/image'
import HeroMessage from './HeroMessage'
import appScreenshot from './app - star mode.png'

export default function LandingScreen() {
	return (
		<section
			id="landing-screen"
			className="flex flex-col h-full"
		>
			<HeroMessage />
			<div className="relative w-full h-full">
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
