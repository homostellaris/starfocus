import { ReactNode } from 'react'

type CalloutType = 'info' | 'warning' | 'success' | 'error'

interface CalloutProps {
	type?: CalloutType
	title?: string
	children: ReactNode
}

const typeStyles: Record<CalloutType, string> = {
	info: 'border-blue-500 bg-blue-950/50',
	warning: 'border-yellow-500 bg-yellow-950/50',
	success: 'border-green-500 bg-green-950/50',
	error: 'border-red-500 bg-red-950/50',
}

const typeIcons: Record<CalloutType, string> = {
	info: 'ℹ️',
	warning: '⚠️',
	success: '✅',
	error: '❌',
}

export default function Callout({
	type = 'info',
	title,
	children,
}: CalloutProps) {
	return (
		<div className={`my-4 rounded-lg border-l-4 p-4 ${typeStyles[type]}`}>
			{title && (
				<div className="mb-2 flex items-center gap-2 font-bold">
					<span>{typeIcons[type]}</span>
					<span>{title}</span>
				</div>
			)}
			<div className="prose-sm">{children}</div>
		</div>
	)
}
