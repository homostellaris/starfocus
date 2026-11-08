import { IonModal, IonSearchbar, isPlatform } from '@ionic/react'
import { usePostHog } from 'posthog-js/react'
import { RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../common/cn'
import useView from '../focus/view'
import { SearchSuggestions } from './SearchSuggestions'

// Static height measured from the rendered modal (browser inspection).
// MODAL_HEIGHT = handle area (10px) + searchbar (42px) + list (310px) = 362px
const MODAL_HEIGHT = 362
const PEEK_HEIGHT = 52 // handle (10px) + searchbar (42px)
export const PEEK_BREAKPOINT = parseFloat((PEEK_HEIGHT / MODAL_HEIGHT).toFixed(4))

export function Search({
	modalRef,
	openRef,
}: {
	modalRef: RefObject<HTMLIonModalElement | null>
	openRef?: RefObject<
		((focus?: boolean, breakpoint?: number, initialQuery?: string) => Promise<void>) | null
	>
}) {
	const searchbarRef = useRef<HTMLIonSearchbarElement>(null)
	const { query, setQuery } = useView()
	const posthog = usePostHog()
	const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1)
	const [initialBreakpoint, setInitialBreakpoint] = useState(1)

	// Ref so keyboard handlers always read the latest query without needing to re-register.
	// Updated in a layout effect (for external changes) and immediately in onIonInput (so the
	// capture-phase keydown handler sees the new value before React re-renders).
	const queryRef = useRef(query)
	useLayoutEffect(() => {
		queryRef.current = query
	})

	useEffect(() => {
		if (searchbarRef.current && searchbarRef.current.value !== query) {
			searchbarRef.current.value = query
			searchbarRef.current.getInputElement().then(input => {
				if (input && input.value !== query) {
					input.value = query
				}
			})
		}
	}, [query])

	const blurSearchInput = useCallback(() => {
		searchbarRef.current?.getInputElement().then(input => input?.blur())
	}, [])

	const focusAndRestore = useCallback(async () => {
		const modal = modalRef.current
		if (!searchbarRef.current) {
			modal?.setAttribute('data-presented', '')
			return
		}
		const currentQuery = queryRef.current
		searchbarRef.current.value = currentQuery
		searchbarRef.current.setFocus()
		searchbarRef.current.getInputElement().then(input => {
			if (input) {
				input.value = currentQuery
				input.focus()
				if (currentQuery) input.setSelectionRange(0, currentQuery.length)
			}
			modal?.setAttribute('data-presented', '')
		})
	}, [modalRef])

	// Tracks whether the next onDidPresent should focus the searchbar.
	// Set synchronously before modal.present() so onDidPresent reads the right value.
	const shouldFocusOnPresentRef = useRef(true)

	const openModal = useCallback(
		async (focus = true, breakpoint = 1, initialQuery?: string) => {
			const modal = modalRef.current
			if (!modal) return
			if (initialQuery !== undefined) {
				queryRef.current = initialQuery
				setQuery(initialQuery)
				if (searchbarRef.current) {
					searchbarRef.current.value = initialQuery
					searchbarRef.current.getInputElement().then(input => {
						if (input) input.value = initialQuery
					})
				}
			}
			const targetBreakpoint = breakpoint ?? 1
			if (modal.classList.contains('overlay-hidden')) {
				shouldFocusOnPresentRef.current = focus
				setInitialBreakpoint(targetBreakpoint)
				;(modal as any).initialBreakpoint = targetBreakpoint
				await modal.present()
				await modal.setCurrentBreakpoint(targetBreakpoint)
				if (focus) {
					await focusAndRestore()
				} else {
					if (searchbarRef.current) {
						searchbarRef.current.value = queryRef.current
						searchbarRef.current.getInputElement().then(input => {
							if (input) input.value = queryRef.current
						})
					}
					if (targetBreakpoint >= 1) {
						modal.setAttribute('data-presented', '')
					}
				}
			} else {
				const currentBreakpoint = parseFloat(modal.dataset.breakpoint ?? '0')
				if (currentBreakpoint !== targetBreakpoint) {
					if (targetBreakpoint === 1) {
						setFocusedSuggestionIndex(-1)
					}
					await modal.setCurrentBreakpoint(targetBreakpoint)
				}
				if (focus) {
					await focusAndRestore()
				} else {
					if (searchbarRef.current) {
						searchbarRef.current.value = queryRef.current
						searchbarRef.current.getInputElement().then(input => {
							if (input) input.value = queryRef.current
						})
					}
					if (targetBreakpoint >= 1) {
						modal.setAttribute('data-presented', '')
					}
				}
			}
		},
		[focusAndRestore, modalRef, setQuery],
	)

	useLayoutEffect(() => {
		if (openRef) openRef.current = openModal
	}, [openModal, openRef])

	// canDismiss prevents the modal from fully dismissing when a query is active.
	// When it returns false and the modal would go to breakpoint 0, Ionic snaps
	// to the lowest non-zero breakpoint (PEEK_BREAKPOINT) instead.
	const canDismiss = useCallback(async () => !queryRef.current, [])

	useEffect(() => {
		const handleKeyDown = async (event: KeyboardEvent) => {
			const modal = modalRef.current
			const isModalOpen = modal && !modal.classList.contains('overlay-hidden')

			if (event.key === '/') {
				event.preventDefault()
				await openModal()
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
				const savedQuery = queryRef.current
				if (savedQuery) {
					await modal.setCurrentBreakpoint(PEEK_BREAKPOINT)
					// IonSearchbar clears its value on Escape; restore the active filter
					queryRef.current = savedQuery
					setQuery(savedQuery)
					if (searchbarRef.current) searchbarRef.current.value = savedQuery
					blurSearchInput()
				} else {
					await modal.dismiss()
				}
				posthog.capture('keyboard_shortcut_used', {
					shortcut_key: 'Escape',
					action: 'dismiss_search',
				})
			}

			if (event.key === 'Enter' && queryRef.current) {
				if (document.activeElement?.tagName === 'ION-ITEM') return
				event.stopPropagation()
				event.stopImmediatePropagation()
				await modal.setCurrentBreakpoint(PEEK_BREAKPOINT)
				blurSearchInput()
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
	}, [blurSearchInput, modalRef, openModal, posthog, setQuery])

	return (
		<IonModal
			id="search-modal"
			ref={modalRef}
			data-query={query}
			data-breakpoint={1}
			breakpoints={[0, PEEK_BREAKPOINT, 1]}
			backdropBreakpoint={PEEK_BREAKPOINT}
			canDismiss={canDismiss}
			handle={true}
			initialBreakpoint={initialBreakpoint}
			style={{ '--height': `calc(${MODAL_HEIGHT}px + env(safe-area-inset-bottom, 0px))` }}
			onIonBreakpointDidChange={e => {
				if (modalRef.current) {
					modalRef.current.dataset.breakpoint = String(e.detail.breakpoint)
					if (e.detail.breakpoint < 1) {
						modalRef.current.removeAttribute('data-presented')
					}
				}
			}}
			onDidPresent={() => {
				setFocusedSuggestionIndex(-1)
				if (shouldFocusOnPresentRef.current) {
					focusAndRestore()
				} else {
					if (searchbarRef.current) {
						searchbarRef.current.value = queryRef.current
						searchbarRef.current.getInputElement().then(input => {
							if (input) input.value = queryRef.current
						})
					}
					const currentBreakpoint = parseFloat(
						modalRef.current?.dataset.breakpoint ?? '1',
					)
					if (currentBreakpoint >= 1) {
						modalRef.current?.setAttribute('data-presented', '')
					}
				}
			}}
			onDidDismiss={() => {
				setInitialBreakpoint(1)
				if (modalRef.current) {
					;(modalRef.current as any).initialBreakpoint = 1
				}
			}}
		>
			<div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
				<IonSearchbar
					ref={searchbarRef}
					className={cn(
						'mx-auto [--background:#121212]',
						!isPlatform('ios') && 'ion-no-padding',
					)}
					showCancelButton="always"
					debounce={100}
					onIonCancel={async () => {
						queryRef.current = ''
						setQuery('')
						await modalRef.current?.dismiss()
					}}
					onIonInput={event => {
						const target = event.target as HTMLIonSearchbarElement
						const newQuery = target?.value ? target.value.toLowerCase() : ''
						// At peek the searchbar clears itself on Escape; ignore that to preserve the active filter.
						const atPeek =
							parseFloat(modalRef.current?.dataset.breakpoint ?? '1') <= PEEK_BREAKPOINT
						if (!newQuery && atPeek) return
						queryRef.current = newQuery
						setQuery(newQuery)
						if (newQuery) {
							posthog.capture('search_performed', {
								query_length: newQuery.length,
							})
						}
					}}
				/>
				<SearchSuggestions
					onClick={async value => {
						queryRef.current = value
						setQuery(value)
						if (searchbarRef.current) searchbarRef.current.value = value
						await modalRef.current?.setCurrentBreakpoint(PEEK_BREAKPOINT)
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
