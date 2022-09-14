// import StatementLarge from './StatementLarge'
// import StatementSmall from './StatementSmall'

export default function HeroMessage() {
	return (
		<>
			{/* <div className="flex flex-wrap items-center justify-center">
							<span className="w-80 border-b text-center">
								<StatementSmall>Avoid earthly distractions</StatementSmall>
							</span>
							<img
								src="/logo.png"
								className="mx-4 w-20"
							></img>
							<span className="w-80 border-b text-center">
								<StatementSmall>Stay focused</StatementSmall>
							</span>
						</div>
						<h2 className="text-center">
							<StatementLarge>Aim for the stars</StatementLarge>
						</h2> */}
			<div className="mx-auto p-4">
				<h1 className="supernova text-center text-2xl font-extrabold text-white">
					The todo list for our future.
				</h1>
				<p className="mx-auto mt-4 max-w-prose text-center text-lg font-medium text-white">
					{/* TODO: Make sure you use the word 'endeavour' because Smooshy said so. Oh and make it rhyme somehow. */}
					{/* TODO: Make it punny? "Make space for your missions" */}
					For humanity to realise its full potential, you must realise yours.
					Start by asking yourself:{' '}
					<i>&quot;How would I want to be remembered?&quot;</i>. Think big
					picture and be ambitious in your answer. <br />
					Then get to work. Avoid earthly distractions. Stay focused. Aim for
					the stars. Starfocus will be there to keep you on course, one todo at
					a time.
				</p>
			</div>
			{/* <p className="m-auto max-w-prose text-center text-white">
							We believe humanity is both destined and duty-bound to ensure life
							thrives beyond Earth's finite lifespan. To achieve this
							productivity is not enough, we need everyone to be the best
							version of themselves. This begins by identifying our own personal
							and meaningful destinies that align with our collective one.
						</p> */}
			{/* <p className="m-auto max-w-prose text-center text-lg text-white">
							You destiny is our destiny. We first help you to identify what
							this is by thinking about how you can have the biggest impact for
							yourself and others. We create a unique constellation for you that
							acts like a 'destiny map'.
							<br />
							<br />
							Now you are ready to embark on a journey to these places.
							Starfocus is with you along the way, ensuring you avoid
							distractions, stay focused, and aim for the stars.
						</p> */}
			{/* <p className="m-auto max-w-prose text-center text-lg text-white">
							Creating a bright future for ourselves isn't easy, especially in
							this age of constant distraction. We need to carefully prioritise
							what truly matters.
							<br />
							<br />
							Starfocus encourages you to brain-dump all those distractions and set loftier goals.
						</p> */}
			{/* <p className="hint m-4 text-center text-xl font-light text-white">
							Scroll up or use the arrow keys to learn more
						</p> */}
		</>
	)
}
