import Todo from './Todo'
import { Event } from '../todos/interfaces'

export default function Events(props: { events: Event[] }) {
	return (
		<div className="events glass z-10 flex items-center rounded-md">
			<div className="left-column w-1/6 grow px-4">
				<p className="hidden text-left text-base font-light uppercase tracking-wide text-slate-400 md:block">
					Up next
				</p>
				<p className="text-left text-xs font-light tracking-wide text-slate-200 md:text-base">
					30m
				</p>
			</div>
			<div className="relative w-4/6 px-20">
				{props.events.length ? (
					<div className="flex">
						<Todo todo={props.events[0]} />
					</div>
				) : (
					'No events here. Sync your calendar to see them.'
				)}
			</div>
			<div className="right-column w-1/6 grow px-4">
				<p className="hidden text-right text-base font-light uppercase tracking-wide text-slate-400 md:block">
					Events
				</p>
				<p className="text-right text-xs font-light tracking-wide text-slate-200 md:text-base">
					3/5
				</p>
			</div>
		</div>
	)
}
