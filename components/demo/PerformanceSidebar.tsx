export default function PerformanceSidebar() {
	return (
		<div className="text-white">
			<section className="mb-4">
				<h1 className="text-xl font-black uppercase italic tracking-tight">
					Velocity
				</h1>
				<div>
					<span className="m-4 font-medium italic">Overall</span>
					<code>8</code>
				</div>
				<div>
					<span className="m-4 font-medium italic">Today</span>
					<code>1</code>
				</div>
			</section>

			<section className="mb-4">
				<h1 className="text-xl font-black uppercase italic tracking-tight">
					Roles
				</h1>
				<div>
					<span className="m-4 font-medium italic">Software Creator</span>
					<code>24%</code>
				</div>
				<div>
					<span className="m-4 font-medium italic">Father</span>
					<code>17%</code>
				</div>
				<div>
					<span className="m-4 font-medium italic">Family Member</span>
					<code>11%</code>
				</div>
				<div>
					<span className="m-4 font-medium italic">Friend</span>
					<code>9%</code>
				</div>
			</section>
		</div>
	)
}
