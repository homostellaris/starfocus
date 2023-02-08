import { Todo as TodoInterface } from './interfaces'

export default function Todo({
	compact,
	reference,
	todo,
}: {
	compact?
	reference?
	todo: TodoInterface
}) {
	return (
		<div
			className={`todo m-2 flex grow items-center justify-between rounded-md bg-[#1b1b1b] text-lg font-normal text-white ${
				todo.completedAt ? 'opacity-70' : ''
			} ${compact ? '' : 'w-full'}`}
			ref={reference}
		>
			<span className={`${compact ? 'hidden' : 'inline'} destination`}>
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
			<span className="p-2 details grow">
				<span className="description">{todo.description}</span>
				<span className="notes-digest"></span>
			</span>
			<span
				className={`${
					compact ? 'hidden' : 'inline'
				} role w-24 p-2 px-4 text-right text-xs font-black uppercase italic tracking-tight`}
			>
				{todo.role}
			</span>
		</div>
	)
}
