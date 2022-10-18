import Starship from './Starship'
import Tracjectory from './Trajectory'

export default function Journey() {
	return (
		<div className="journey hidden md:block">
			<div className="h-screen">
				<Tracjectory />
			</div>
			<div
				id="starship"
				className="h-[100px] w-[100px]"
			>
				{/* TODO: Animate the ship based on the scroll */}
				<Starship />
			</div>
		</div>
	)
}
