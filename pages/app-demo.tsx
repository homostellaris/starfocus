import Events from '../components/todos/Events'
import Planets from '../components/common/Planets'
import ControlPanel from '../components/app/ControlPanel'
import RoleSidebar from '../components/app/RoleSidebar'
import PerformanceSidebar from '../components/app/PerformanceSidebar'
import Journey from '../components/app/Journey'

export default function AppDemo() {
	// useEffect(setupAnimations, [])
	// useEffect(() => {
	// 	const todos = document.getElementsByClassName('todo')
	// 	const mostImportantTodo = todos[todos.length - 1]
	// 	mostImportantTodo.scrollIntoView()
	// }, [])

	return (
		<div className="relative w-full">
			<main className="h-full">
				<header className="fixed top-0 z-10 w-full">
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
				</header>
				<div className="fixed left-0 z-10 hidden w-1/6 p-4 text-white left-column top-24 lg:block">
					<PerformanceSidebar />
				</div>
				<div className="fixed right-0 z-10 hidden w-1/6 p-4 right-column top-24 lg:block">
					<RoleSidebar />
				</div>
				<div className="h-full parallax-container no-scrollbar">
					<div
						className={`plane-negative-1 h-[calc(${8 * 100}vh)] absolute
							-z-10`}
					>
						<Planets height="h-[800vh]" />
					</div>
					<Journey />
				</div>
				<ControlPanel />
			</main>
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
