import Todo from './Todo'
import { Event } from '../todos/interfaces'

export default function Events(props: { events: Event[] }) {
	return (
		<div className="events glass z-10 flex items-center rounded-md">
			<div className="left-column w-1/12 grow pl-2">
				<p className="hidden text-left text-base font-light uppercase tracking-wide text-slate-400 md:block">
					Up next
				</p>
				<p className="text-left text-xs font-light tracking-wide text-slate-200 md:text-base">
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
			<div className="right-column w-1/12 grow pr-2">
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
