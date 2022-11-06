import Layout from '../../components/common/Layout'
import Feature from '../../components/landingPage/Features/Feature'

export default function Today(props) {
	return (
		<Layout title="Today">
			<Feature
				id="today"
				heading="Today"
				previews={[]}
				top={0}
			>
				If you choose to integrate Starfocus with your calendar then the today
				view will show your next event so that you never miss a meeting.
				<br />
				<br />A separate area for time-bound tasks reduces noise and allows you
				to stay focused on your loftier goals. You can also add notes to events
				which is useful for itineraries or a reminder to bring up a particular
				issue in a meeting.
			</Feature>
		</Layout>
	)
}
