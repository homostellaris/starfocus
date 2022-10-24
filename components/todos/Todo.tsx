import { Todo as TodoInterface } from './interfaces'

type TodoPropType = {
	todo: TodoInterface
}

export default function Todo(props: TodoPropType) {
	return (
		<div
			className={`todo m-2 flex items-center justify-between rounded-md bg-[#1b1b1b] text-lg font-normal text-white ${
				props.todo.completedAt ? 'opacity-70' : ''
			}`}
		>
			<span className="status">
				<svg
					viewBox="0 0 100 100"
					xmlns="http://www.w3.org/2000/svg"
					className="w-16"
				>
					<circle
						cx="50"
						cy="50"
						r="10"
						fill="none"
						stroke="white"
						strokeWidth="2px"
					/>
				</svg>
			</span>
			<span className="details grow">
				<span className="description">{props.todo.description}</span>
				<span className="notes-digest"></span>
			</span>
			<span className="role hidden w-24 px-4 text-right text-xs font-black uppercase italic tracking-tight md:inline">
				{props.todo.role}
			</span>
		</div>
	)
}
