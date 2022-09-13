import Todo from './Todo'

export default function Today() {
	return (
		<div className="glass z-10 flex rounded-md">
			<div className="left-column hidden w-28 shrink-0 grow p-4 md:block">
				<p className="text-left text-base font-light uppercase tracking-wide text-slate-400">
					Up next
				</p>
				<p className="text-left text-base font-light tracking-wide text-slate-200">
					30m
				</p>
			</div>
			<div className="w-3/5 grow-[3]">
				<Todo
					todo={{
						id: '1',
						description: 'Teach Thomas how to cook pasta',
					}}
				/>
			</div>
			<div className="right-column hidden w-28 shrink-0 grow p-4 md:block">
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
