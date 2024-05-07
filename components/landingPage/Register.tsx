import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { usePlausible } from 'next-plausible'
import { useState } from 'react'

export default function Register() {
	const registerEmail = useMutation(api.registerEmail.default)
	const [email, setEmail] = useState<string>()
	const [isSubmitted, setIsSubmitted] = useState<boolean>()

	const plausible = usePlausible()

	return (
		<>
			<form
				className="text-center text-white register"
				onSubmit={async event => {
					event.preventDefault()

					plausible('Subscribe to email updates')

					await registerEmail({ email })
					setIsSubmitted(true)
				}}
			>
				<div className="flex p-2 text-white border rounded-md">
					{isSubmitted ? (
						<p>Subscribed as {email} ✅</p>
					) : (
						<>
							<input
								aria-label="Subscribe to email updates"
								className="w-[23ch] bg-transparent pl-2 text-white"
								type="email"
								id="email"
								name="email"
								placeholder="Subscribe to email updates"
								onChange={event => setEmail(event.target.value)}
							></input>
							<button
								className="pl-2 border-l"
								type="submit"
							>
								Submit
							</button>
						</>
					)}
				</div>
			</form>
		</>
	)
}
