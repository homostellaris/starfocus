import { IonItem, IonLabel, IonList } from '@ionic/react'
import { type CSSProperties, useEffect, useRef } from 'react'

const SUGGESTIONS = [
	{ label: 'is:snoozed', value: 'is:snoozed' },
	{ label: '#1', value: '#1' },
	{ label: '#2', value: '#2' },
	{ label: '#3', value: '#3' },
	{ label: '#4', value: '#4' },
	{ label: '#5', value: '#5' },
]

type Props = {
	onClick: (query: string) => void
	focusedIndex: number
	onFocusChange: (index: number) => void
}

export function SearchSuggestions({ onClick, focusedIndex, onFocusChange }: Props) {
	const itemRefs = useRef<Array<HTMLIonItemElement | null>>([])

	useEffect(() => {
		if (focusedIndex >= 0) {
			const el = itemRefs.current[focusedIndex]
			el?.scrollIntoView({ block: 'nearest' })
			el?.focus()
		}
	}, [focusedIndex])

	return (
		<IonList lines="full">
			{SUGGESTIONS.map((suggestion, index) => (
				<IonItem
					key={suggestion.value}
					ref={el => { itemRefs.current[index] = el }}
					button
					detail={false}
					tabIndex={0}
					style={focusedIndex === index ? { '--background': 'rgba(255,255,255,0.12)' } as CSSProperties : undefined}
					onClick={() => onClick(suggestion.value)}
					onKeyDown={event => {
						if (event.key === 'Enter') {
							event.preventDefault()
							onClick(suggestion.value)
						}
						if (event.key === 'ArrowDown') {
							event.preventDefault()
							onFocusChange(Math.min(index + 1, SUGGESTIONS.length - 1))
						}
						if (event.key === 'ArrowUp') {
							event.preventDefault()
							onFocusChange(index - 1)
						}
					}}
				>
					<IonLabel>{suggestion.label}</IonLabel>
				</IonItem>
			))}
		</IonList>
	)
}
