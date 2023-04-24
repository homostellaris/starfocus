import { useState } from 'react'

export default function UpwardGrowingList() {
	const [todos, setTodos] = useState([{ title: 'hello' }])
	return (
		<div>
			<button
				className="float-right border"
				onClick={() => {
					setTodos(todos => [...todos, { title: 'hello' }])
				}}
			>
				Add todo
			</button>
			<ul className="w-24 border">
				{todos.map(({ title }, index) => (
					<li key={index}>{title}</li>
				))}
			</ul>
		</div>
	)
}
