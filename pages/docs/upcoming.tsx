import Layout from '../../components/common/Layout'
import Feature from '../../components/landingPage/Features/Feature'

export default function Upcoming(props) {
	return (
		<Layout title="Upcoming">
			<Feature
				id="upcoming"
				heading="Upcoming"
			>
				The today view can be expanded at any time to show you everything
				that&apos;s upcoming.
				<br />
				<br />
				Not only will events from your calendar show here, but also any dates in
				your todo notes. This flexible system can support a simple deadline or a
				series of milestones.
				<br />
				<br />
				Every morning you&apos;ll be prompted to review the next few days in the
				upcoming view so you never miss a deadline.
			</Feature>
		</Layout>
	)
}
