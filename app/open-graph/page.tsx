import Starship from '../../components/common/Starship'
import Tracjectory from '../../components/starship/Trajectory'

export default function Page() {
	return (
		<div className="bg-[radial-gradient(circle_700px_at_50%_250px,#4453a9,#000000)] flex flex-col w-[1200px] h-[630px] items-center justify-center gap-8">
			<div className="space-y-4">
				<h1 className="font-bold uppercase text-6xl lg:text-9xl font-display [font-palette:--redshift]">
					Starfocus
				</h1>
				<h2 className="font-mono text-xl font-bold text-center text-white lg:text-4xl">
					Self-defined productivity
				</h2>
			</div>
			{/* <Tracjectory
				className="m-20"
				orientation="horizontal"
			/> */}
			<div className="relative w-[56px] h-[56px] shrink-0">
				<Starship className="rotate-90" />
			</div>
		</div>
	)
}
