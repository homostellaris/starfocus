import Starship from "./Starship";
import Tracjectory from "./Trajectory";

export default function () {
	return (
		<div className="mx-[calc(100vw/12*2)]">
			<div className="h-screen">
				<Tracjectory />
			</div>
			<div className="absolute bottom-44 -translate-x-1/2">
				{/* TODO: Animate the ship based on the scroll */}
				<Starship />
			</div>
		</div>
	)
}