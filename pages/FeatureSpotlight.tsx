export default function FeatureSpotlight(props) {
	return (
		<section id={props.id} className="h-screen relative">
			{props.children}
		</section>
	)
}