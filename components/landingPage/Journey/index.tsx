import Starship from '../../common/Starship'
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
				<Starship />
			</div>
		</div>
	)
}
