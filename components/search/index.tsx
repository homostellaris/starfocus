import { IonModal, IonSearchbar, isPlatform } from '@ionic/react'
import { usePostHog } from 'posthog-js/react'
import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../common/cn'
import useView from '../focus/view'
import { SearchSuggestions } from './SearchSuggestions'

// Static heights measured from the rendered modal (browser inspection).
// The content is static so these don't change at runtime.
// MODAL_HEIGHT = handle area (10px) + searchbar (42px) + list (310px) = 362px
// PEEK_HEIGHT = handle area (10px) + searchbar (42px) = 52px
const MODAL_HEIGHT = 362
const PEEK_BREAKPOINT = 52 / MODAL_HEIGHT // ≈ 0.1437
const isAtPeek = (bp: number | undefined) =>
	bp !== undefined && Math.abs(bp - PEEK_BREAKPOINT) < 0.001

export function Search({
	modalRef,
}: {
	modalRef: RefObject<HTMLIonModalElement | null>
}) {
	const searchbarRef = useRef<HTMLIonSearchbarElement>(null)
	const { query, setQuery } = useView()
	const posthog = usePostHog()
	const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1)

	// Ref so keyboard handlers always read the latest query without needing to re-register.
	// Updated in a layout effect (for external changes) and immediately in onIonInput (so the
	// capture-phase keydown handler sees the new value before React re-renders).
	const queryRef = useRef(query)
	useLayoutEffect(() => {
		queryRef.current = query
	})

	// Saved synchronously before setCurrentBreakpoint(PEEK) because the Stencil animation
	// resets the searchbar value and fires ionInput(''), wiping queryRef and React state.
	const peekQueryRef = useRef('')

	// Set to true before every programmatic snap to PEEK. The first ionInput('') that arrives
	// after the snap is a spurious Stencil value-reset event — consuming it clears this flag.
	// Subsequent ionInput('') events are real user clears and are handled normally.
	const pendingPeekInputRef = useRef(false)

	// Clears query state and ref, saves it to peekQueryRef, then snaps to PEEK.
	// Clearing query immediately (rather than relying on the spurious ionInput('') to clear it)
	// ensures queryRef is '' at PEEK so a second Escape can dismiss.
	const snapToPeek = useCallback(
		(currentQuery: string) => {
			peekQueryRef.current = currentQuery
			pendingPeekInputRef.current = true
			queryRef.current = ''
			setQuery('')
			modalRef.current?.setCurrentBreakpoint(PEEK_BREAKPOINT)
		},
		[modalRef, setQuery],
	)

	const snapToPeekOrDismiss = useCallback(async () => {
		if (queryRef.current) {
			snapToPeek(queryRef.current)
		} else {
			await modalRef.current?.dismiss()
		}
	}, [modalRef, snapToPeek])

	const canDismiss = useCallback(async () => {
		if (queryRef.current) {
			snapToPeek(queryRef.current)
			return false
		}
		return true
	}, [snapToPeek])

	useEffect(() => {
		const handleKeyDown = async (event: KeyboardEvent) => {
			const modal = modalRef.current
			const isModalOpen = modal && !modal.classList.contains('overlay-hidden')

			if (event.key === '/') {
				event.preventDefault()
				const currentBreakpoint = await modal?.getCurrentBreakpoint()
				if (isAtPeek(currentBreakpoint)) {
					const savedQuery = peekQueryRef.current
					await modal?.setCurrentBreakpoint(1)
					queryRef.current = savedQuery
					setQuery(savedQuery)
					if (searchbarRef.current) searchbarRef.current.value = savedQuery
					const input = await searchbarRef.current?.getInputElement()
					if (input) {
						input.value = savedQuery
						input.focus()
						requestAnimationFrame(() =>
							input.setSelectionRange(0, savedQuery.length),
						)
					}
				} else {
					modal?.present()
				}
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: '/',
					action: 'search_focus',
				})
				return
			}

			if (!isModalOpen) return

			if (event.key === 'Escape') {
				event.stopPropagation()
				event.stopImmediatePropagation()
				snapToPeekOrDismiss()
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: 'Escape',
					action: 'dismiss_search',
				})
			}

			if (event.key === 'Enter' && queryRef.current) {
				if (document.activeElement?.tagName === 'ION-ITEM') return
				event.stopPropagation()
				event.stopImmediatePropagation()
				snapToPeek(queryRef.current)
			}

			if (
				event.key === 'ArrowDown' &&
				document.activeElement?.tagName !== 'ION-ITEM'
			) {
				event.stopPropagation()
				event.preventDefault()
				setFocusedSuggestionIndex(0)
				modal?.setCurrentBreakpoint(1)
			}
		}
		// Capture phase fires before Ionic's shadow DOM handlers, letting us intercept
		// Escape/Enter/ArrowDown before Ionic's searchbar processes them
		document.addEventListener('keydown', handleKeyDown, true)
		return () => document.removeEventListener('keydown', handleKeyDown, true)
	}, [modalRef, posthog, setQuery, snapToPeek, snapToPeekOrDismiss])

	return (
		<IonModal
			id="search-modal"
			ref={modalRef}
			data-query={query}
			data-breakpoint={1}
			breakpoints={[0, PEEK_BREAKPOINT, 1]}
			onIonBreakpointDidChange={e => {
				if (modalRef.current) modalRef.current.dataset.breakpoint = String(e.detail.breakpoint)
			}}
			backdropBreakpoint={PEEK_BREAKPOINT}
			canDismiss={canDismiss}
			handle={true}
			initialBreakpoint={1}
			style={{ '--height': `${MODAL_HEIGHT}px` }}
			onDidPresent={() => {
				if (searchbarRef.current) {
					searchbarRef.current.value = query
					searchbarRef.current.setFocus()
				}
				setFocusedSuggestionIndex(-1)
			}}
		>
			<div>
				<IonSearchbar
					ref={searchbarRef}
					className={cn(
						'mx-auto [--background:#121212]',
						!isPlatform('ios') && 'ion-no-padding',
					)}
					debounce={100}
					onIonInput={async event => {
						const target = event.target as HTMLIonSearchbarElement
						let newQuery = ''
						if (target?.value) newQuery = target.value.toLowerCase()

						// The first ionInput('') after a programmatic PEEK snap is a spurious
						// Stencil value-reset — consume it without changing state (query was
						// already cleared by snapToPeek before the animation started).
						if (!newQuery && pendingPeekInputRef.current) {
							pendingPeekInputRef.current = false
							return
						}

						queryRef.current = newQuery
						setQuery(newQuery)
						if (newQuery) {
							posthog.capture('search_performed', {
								query_length: newQuery.length,
							})
						} else {
							const currentBreakpoint =
								await modalRef.current?.getCurrentBreakpoint()
							if (isAtPeek(currentBreakpoint)) {
								await modalRef.current?.setCurrentBreakpoint(1)
							}
						}
					}}
				/>
				<SearchSuggestions
					onClick={value => {
						// Suggestion clicks keep the query active at PEEK (unlike Escape/Enter
						// which clear it) so the filter remains applied while the modal is peeking.
						queryRef.current = value
						peekQueryRef.current = value
						pendingPeekInputRef.current = true
						setQuery(value)
						if (searchbarRef.current) searchbarRef.current.value = value
						modalRef.current?.setCurrentBreakpoint(PEEK_BREAKPOINT)
					}}
					focusedIndex={focusedSuggestionIndex}
					onFocusChange={index => {
						if (index < 0) {
							searchbarRef.current?.setFocus()
							setFocusedSuggestionIndex(-1)
						} else {
							setFocusedSuggestionIndex(index)
						}
					}}
				/>
			</div>
		</IonModal>
	)
}
