import Todo from './Todo'
import { Event } from '../todos/interfaces'

export default function Events(props: { events: Event[] }) {
	return (
		<div className="z-10 flex items-center rounded-md events glass">
			<div className="w-1/6 pl-4 left-column grow">
				<p className="hidden text-base font-light tracking-wide text-left uppercase text-slate-400 md:block">
					Up next
				</p>
				<p className="text-xs font-light tracking-wide text-left text-slate-200 md:text-base">
					30m
				</p>
			</div>
			<div className="w-4/6 px-20 grow">
				{props.events.length ? (
					<Todo todo={props.events[0]} />
				) : (
					'No events here. Sync your calendar to see them.'
				)}
			</div>
			<div className="w-1/6 pr-4 right-column grow">
				<p className="hidden text-base font-light tracking-wide text-right uppercase text-slate-400 md:block">
					Events
				</p>
				<p className="text-xs font-light tracking-wide text-right text-slate-200 md:text-base">
					3/5
				</p>
			</div>
		</div>
	)
}
