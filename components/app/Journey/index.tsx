import Todos from '../../todos'
import Log from '../../todos/Log'
import todosFixture from '../../todos/todos.json'

export default function Journey() {
	return (
		<div className="w-4/6 m-auto max-w-prose grow">
			<Todos todos={todosFixture} />
			<Log
				todos={[
					{
						id: '1',
						completedAt: new Date('2020-01-01'),
						description: 'Complete Typescript course',
						role: 'Software Creator',
					},
					{
						id: '2',
						completedAt: new Date('2020-01-01'),
						description: 'Complete Typescript course',
						role: 'Software Creator',
					},
					{
						id: '3',
						completedAt: new Date('2020-01-01'),
						description: 'Complete Typescript course',
						role: 'Software Creator',
					},
				]}
			/>
		</div>
	)
}
