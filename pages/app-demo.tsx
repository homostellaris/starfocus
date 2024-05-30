import App from '../components/app'

export default function AppDemo() {
	// useEffect(setupAnimations, [])
	// useEffect(() => {
	// 	const todos = document.getElementsByClassName('todo')
	// 	const mostImportantTodo = todos[todos.length - 1]
	// 	mostImportantTodo.scrollIntoView()
	// }, [])
	return <App />
}

function setupAnimations() {
	const whatIsStarfocus = document.getElementById('what-is-starfocus')!

	let observer = new IntersectionObserver(
		entries => {
			const appDemo = document.getElementById('app-demo')!
			if (entries[0].isIntersecting) {
				appDemo.classList.add('expanded')
			} else {
				appDemo.classList.remove('expanded')
			}
		},
		{
			threshold: 0,
		},
	)

	observer.observe(whatIsStarfocus)
}
