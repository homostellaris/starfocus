import { Todo as TodoInterface } from './interfaces'

export default function Todo({ todo }: { todo: TodoInterface }) {
	return (
		<div
			className={`todo m-2 flex items-center justify-between rounded-md bg-[#1b1b1b] text-lg font-normal text-white ${
				todo.completedAt ? 'opacity-70' : ''
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
				<span className="description">{todo.description}</span>
				<span className="notes-digest"></span>
			</span>
			<span className="hidden w-24 px-4 text-xs italic font-black tracking-tight text-right uppercase role md:inline">
				{todo.role}
			</span>
		</div>
	)
}
