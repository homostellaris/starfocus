import { useEffect } from 'react'
import Todos from '../todos'
import Events from '../todos/Events'
import Log from '../todos/Log'

export default function AppDemo() {
	// useEffect(setupAnimations, [])
	useEffect(() => {
		const todos = document.getElementsByClassName('todo')
		const mostImportantTodo = todos[todos.length - 1]
		// mostImportantTodo.scrollIntoView()
	}, [])

	return (
		<div
			id="app-demo"
			className="relative h-full overflow-hidden border rounded-md"
		>
			<div className="absolute z-10 w-full">
				<Events
					events={[
						{
							id: '1',
							description: 'Meeting with Steve',
							role: 'Software Creator',
							start: new Date(),
							end: new Date(),
						},
					]}
				/>
			</div>
			{/* Need to have h-full on everything down to this point in order for overflow-auto to work 🤷‍♂️ */}
			<div className="flex h-full overflow-auto no-scrollbar">
				<div className="w-1/12 pl-2 left-column grow"></div>
				<div className="w-10/12 max-w-[800px] grow">
					<Todos
						todos={[
							{
								id: '2',
								description: 'Teach Thomas how to cook pasta',
								role: 'Father',
							},
							{
								id: '3',
								description: 'Write bestman speech',
								role: 'Friend',
							},
							{
								id: '4',
								description: 'Take the bins out',
								role: 'Family Member',
							},
							{
								id: '5',
								description: 'Reply to Sandra',
								role: 'Software Creator',
							},
							{
								id: '6',
								description: 'Do some laundry',
								role: 'Family Member',
							},
							{
								id: '7',
								description: 'Arrange dentist appointment',
								role: 'Individual',
							},
							{
								id: '8',
								description: 'Pay parking fine',
								role: 'Family Member',
							},
							{
								id: '9',
								description: 'Take the dog out',
								role: 'Family Member',
							},
							{
								id: '10',
								description: 'Call Mum',
								role: 'Family Member',
							},
							{
								id: '11',
								description: 'Watch the bouldering world cup',
								role: 'Climber',
							},
							{
								id: '12',
								description: 'Read Anthropocosmos',
								role: 'Space Explorer',
							},
						]}
					/>
					<Log
						todos={[
							{
								id: '1',
								completedAt: new Date('2020-01-01'),
								description: 'Complete Typescript course',
								role: 'Software Creator',
							},
						]}
					/>
				</div>
				<div className="right-column mt-[80px] w-1/12 grow pr-2">
					{/* <div className="text-white">
						<h1>Software Developer</h1>
						<h2>Mission Statement</h2>
						<p>
							Treat my employers company with the same care and seriousness I
							would treat my own.
						</p>
						<h2>Affirmations</h2>
						<ol>
							<li>Stop starting, start finishing.</li>
							<li>KISS</li>
							<li>Always understand the why.</li>
							<li>
								Iteratying on plans and prototypes &gt; iterating on code.
							</li>
						</ol>
					</div> */}
				</div>
			</div>
		</div>
	)
}

function setupAnimations() {
	const whatIsStarfocus = document.getElementById('what-is-starfocus')

	let observer = new IntersectionObserver(
		entries => {
			const appDemo = document.getElementById('app-demo')
			if (entries[0].isIntersecting) {
				appDemo.classList.add('expanded')
			} else {
				appDemo.classList.remove('expanded')
			}
		},
		{
			threshold: 0,
		}
	)

	observer.observe(whatIsStarfocus)
}
