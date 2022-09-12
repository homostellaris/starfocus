export default function A(props) {
	return (
		<a
			className="text-blue-600 underline visited:text-purple-600 hover:text-blue-800"
			{...props}
		>
			{props.children}
		</a>
	)
}
