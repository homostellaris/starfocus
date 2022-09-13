import Starship from './Starship'
import Tracjectory from './Trajectory'

export default function () {
	return (
		<div className="hidden md:block">
			<div className="h-screen">
				<Tracjectory />
			</div>
			<div
				id="starship"
				className="fixed bottom-28 -translate-x-1/2"
			>
				{/* TODO: Animate the ship based on the scroll */}
				<Starship />
			</div>
		</div>
	)
}