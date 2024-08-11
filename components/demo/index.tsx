import { useEffect, useState } from 'react'
import ControlPanel from './ControlPanel'
import Journey from './Journey'
import PerformanceSidebar from './PerformanceSidebar'
import RoleSidebar from './RoleSidebar'
import Planets from '../common/Planets'
import Events from '../todos/Events'
import useTodos from '../todos/useTodos'

export default function Demo() {
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
				<div className="fixed left-0 z-10 hidden w-1/6 p-4 text-white left-column top-24 lg:block">
					<PerformanceSidebar />
				</div>
				<div className="fixed right-0 z-10 hidden w-1/6 p-4 right-column top-24 lg:block">
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
