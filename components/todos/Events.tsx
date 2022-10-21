import Todo from './Todo'
import { Event } from '../todos/interfaces'

export default function Events(props: { events: Event[] }) {
	return (
		<div className="events glass z-10 flex rounded-md">
			<div className="left-column w-1/5 grow p-4">
				<p className="text-left text-base font-light uppercase tracking-wide text-slate-400">
					Up next
				</p>
				<p className="text-left text-base font-light tracking-wide text-slate-200">
					30m
				</p>
			</div>
			<div className="w-3/5 grow">
				{props.events.length ? (
					<Todo todo={props.events[0]} />
				) : (
					'No events here. Sync your calendar to see them.'
				)}
			</div>
			<div className="right-column w-1/5 grow p-4">
				<p className="text-right text-base font-light uppercase tracking-wide text-slate-400">
					Events
				</p>
				<p className="text-right text-base font-light tracking-wide text-slate-200">
					3/5
				</p>
			</div>
		</div>
	)
}
