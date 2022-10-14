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
				className="register m-4 text-center text-white"
				onSubmit={async event => {
					event.preventDefault()

					plausible('Subscribe to email updates')

					await registerEmail(email)
					setIsSubmitted(true)
				}}
			>
				<div className="flex rounded-md border p-2 text-white">
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
