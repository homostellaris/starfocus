import Todo from './Todo'
import { Event } from '../todos/interfaces'

export default function Events(props: { events: Event[] }) {
	return (
		<div className="events glass z-10 flex rounded-md">
			<div className="left-column min-w-[20px] grow p-4">
				<p className="hidden text-left text-base font-light uppercase tracking-wide text-slate-400 md:block">
					Up next
				</p>
				<p className="hidden text-left text-base font-light tracking-wide text-slate-200 md:block">
					30m
				</p>
			</div>
			<div className="w-11/12 max-w-[800px] grow">
				{props.events.length ? (
					<Todo todo={props.events[0]} />
				) : (
					'No events here. Sync your calendar to see them.'
				)}
			</div>
			<div className="right-column min-w-[20px] grow p-4">
				<p className="hidden text-right text-base font-light uppercase tracking-wide text-slate-400 md:block">
					Events
				</p>
				<p className="hidden text-right text-base font-light tracking-wide text-slate-200 md:block">
					3/5
				</p>
			</div>
		</div>
	)
}
