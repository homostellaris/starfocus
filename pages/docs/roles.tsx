import Layout from '../../components/common/Layout'
import Feature from '../../components/landingPage/Features/Feature'

export default function Roles(props) {
	return (
		<Layout title="Roles">
			<Feature
				id="roles"
				heading="Roles"
			>
				What are your goals in life? To answer this question you can think about
				the important roles you fulfill in your life, imagine a beautiful future
				in which you excel in these roles, and write down a mission statement
				for each one to inspire yourself!
				<br />
				<br />
				Every todo in Starfocus can be assigned to a role and you can quickly
				filter everything you see in the app to a particular role when you are
				focusing on that particular area of your life.
				<br />
				<br />
				Roles are also good frames of reference when you are reflecting on your
				progress and we&apos;ll surface stats to help you with this. Maybe
				you&apos;ve gathered a lot of star points in the software creator role
				but not so many in the friend role? Time to re-prioritise!
				<br />
				<br />
				You don&apos;t have to write your mission statements right now, but
				deciding on the roles is the first step in your Starfocus journey and
				we&apos;d like you to start it right now!
				<br />
				<br />
				We&apos;ll even generate a completely unique constellation from your
				roles and a unique URL to add to your bios.
			</Feature>
		</Layout>
	)
}
