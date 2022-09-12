import Todos from '../todos'
import Today from '../todos/Today'

export default function AppDemo() {
	// useEffect(setupAnimations, [])
	return (
		<div
			id="app-demo"
			className="h-full rounded-md border"
		>
			<Today />
			<div className="flex">
				<div className="left-column hidden w-28 shrink-0 grow md:block"></div>
				<div className="w-3/5 grow-[3]">
					<Todos
						todos={[
							{
								id: '1',
								description: 'Complete Typescript course',
								role: 'Software Creator',
							},
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
						]}
					/>
				</div>
				<div className="right-column hidden w-28 shrink-0 grow md:block"></div>
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
