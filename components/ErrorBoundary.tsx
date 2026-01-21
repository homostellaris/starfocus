import posthog from 'posthog-js'
import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
	children?: ReactNode
}

interface State {
	hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	}

	public static getDerivedStateFromError(_: Error): State {
		return { hasError: true }
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('Uncaught error:', error, errorInfo)
		posthog.captureException(error)
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div>
					<p className="mx-auto my-4 text-xl text-center max-w-prose">
						Sorry there was an error. If you&apos;ve unsynced, re-syncing might
						fix the issue.
					</p>
				</div>
			)
		}

		return this.props.children
	}
}

export default ErrorBoundary
