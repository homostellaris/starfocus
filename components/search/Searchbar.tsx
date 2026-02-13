import { IonSearchbar, isPlatform } from '@ionic/react'
import { usePostHog } from 'posthog-js/react'
import { forwardRef } from 'react'
import { cn } from '../common/cn'
import useView from '../focus/view'

export const Searchbar = forwardRef<HTMLIonSearchbarElement>(
	function Searchbar(_props, ref) {
		const posthog = usePostHog()
		const { setQuery } = useView()

		return (
			<IonSearchbar
				ref={ref}
				className={cn(
					'mx-auto [--background:#121212]',
					!isPlatform('ios') && 'ion-no-padding',
				)}
				debounce={100}
				/* Binding to the capture phase allows the searchbar to complete its native behaviour of clearing the input.
				 * Without this the input would blur but the input would still have a value and the todos would still be filtered. */
				onKeyDownCapture={event => {
					if (event.key === 'Escape') {
						// TS complains unless we narrow the type
						if (document.activeElement instanceof HTMLElement)
							document.activeElement.blur()
						posthog.capture('keyboard_shortcut_used', {
							shortcut_key: 'Escape',
							action: 'blur_search',
						})
					}
				}}
				onIonInput={event => {
					const target = event.target as HTMLIonSearchbarElement
					let query = ''
					if (target?.value) query = target.value.toLowerCase()
					setQuery(query)
					if (query)
						posthog.capture('search_performed', { query_length: query.length })
				}}
				// placeholder="command + k to focus, / to search, is:snoozed"
			></IonSearchbar>
		)
	},
)
