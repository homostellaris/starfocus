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
			<HeroMessage />
			<div className="relative h-full w-full">
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
