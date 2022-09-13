import { usePlausible } from 'next-plausible'
import { useState } from 'react'
import { useMutation } from '../../convex/_generated/react'

export default function Register() {
	const registerEmail = useMutation('registerEmail')
	const [email, setEmail] = useState<string>()
	const [isSubmitted, setIsSubmitted] = useState<boolean>()

	const plausible = usePlausible()

	return (
		<>
			<form
				className="text-white"
				onSubmit={async event => {
					event.preventDefault()

					plausible('Subscribe to email updates')

					await registerEmail(email)
					setIsSubmitted(true)
				}}
			>
				<label htmlFor="email">Subscribe to email updates</label>
				<div className="flex rounded-md border p-2 text-white">
					{isSubmitted ? (
						<p>Subscribed as {email} ✅</p>
					) : (
						<>
							<input
								className="w-full bg-transparent pl-2 text-white"
								type="email"
								id="email"
								name="email"
								placeholder="Email"
								onChange={event => setEmail(event.target.value)}
							></input>
							<button
								className="border-l pl-2"
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
