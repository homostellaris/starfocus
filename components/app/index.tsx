import { useEffect, useState } from 'react'
import ControlPanel from '../app/ControlPanel'
import Journey from '../app/Journey'
import PerformanceSidebar from '../app/PerformanceSidebar'
import RoleSidebar from '../app/RoleSidebar'
import Planets from '../common/Planets'
import Events from '../todos/Events'
import useTodos from '../todos/useTodos'

export default function App() {
	const [todos, _] = useTodos()
	const [eventsExpanded] = useKeyboardShortcuts()

	return (
		<div className="relative w-full">
			<main className="h-full">
				<header className="fixed top-0 z-20 w-full">
					<Events
						events={[
							{
								id: '1',
								rank: 1,
								description: 'Meeting with Steve',
								role: 'Software Creator',
								start: new Date(),
								end: new Date(),
							},
							{
								id: '2',
								rank: 2,
								description: 'Meeting with Dave',
								role: 'Software Creator',
								start: new Date(),
								end: new Date(),
							},
							{
								id: '3',
								rank: 3,
								description: 'Meeting with Bob',
								role: 'Software Creator',
								start: new Date(),
								end: new Date(),
							},
						]}
						expanded={eventsExpanded}
					/>
				</header>
				<div className="left-column fixed left-0 top-24 z-10 hidden w-1/6 p-4 text-white lg:block">
					<PerformanceSidebar />
				</div>
				<div className="right-column fixed right-0 top-24 z-10 hidden w-1/6 p-4 lg:block">
					<RoleSidebar />
				</div>
				<div className="parallax-container h-full scroll-p-[calc(100vh-10rem)]">
					<div
						className={`plane-negative-1 h-[calc(${8 * 100}vh)] absolute
							-z-10`}
					>
						<Planets height="h-[800vh]" />
					</div>
					{todos.length ? <Journey todos={todos} /> : 'Loading!'}
				</div>
				<ControlPanel />
			</main>
		</div>
	)
}

function useKeyboardShortcuts() {
	const [eventsExpanded, setEventsExpanded] = useState<boolean>(false)

	useEffect(() => {
		document.addEventListener('keydown', event => {
			if (event.key === 'e') {
				setEventsExpanded(value => !value)
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return [eventsExpanded]
}
