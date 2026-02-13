import { useLiveQuery } from 'dexie-react-hooks'
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from 'react'
import { db, StarRole, Todo } from '../db'

interface View {
	activeStarRoles: string[]
	activateAllStarRoles: () => void
	activateStarRole: (id: StarRole['id']) => void
	allStarRolesActive: boolean
	deactivateStarRole: (id: StarRole['id']) => void
	focusedStarRole: null | StarRole['id']
	inActiveStarRoles: (todo: Todo) => boolean
	setActiveStarRoles: (ids: string[]) => void
	starRolesCount: number
	query: string
	setQuery: (query: string) => void
}

export const ViewContext = createContext<View>({
	activeStarRoles: [],
	activateAllStarRoles: () => null,
	activateStarRole: () => null,
	allStarRolesActive: true,
	deactivateStarRole: () => null,
	focusedStarRole: null,
	inActiveStarRoles: () => true,
	setActiveStarRoles: () => null,
	starRolesCount: 0,
	query: '',
	setQuery: () => null,
})

const noStarRole = ''

export function ViewProvider({ children }: { children: React.ReactNode }) {
	const [query, setQuery] = useState<string>('')

	const starRoles = useLiveQuery(() => db.starRoles.toArray())
	const starRolesIncludingNoStarRole = useMemo(
		() => [...(starRoles || []).map(({ id }) => id), noStarRole],
		[starRoles],
	)

	const [activeStarRoles, setActiveStarRoles] = useState<string[]>([])
	const prevStarRolesRef = useRef(starRolesIncludingNoStarRole)
	// eslint-disable-next-line react-hooks/refs -- React-recommended "adjust state during render" pattern
	if (prevStarRolesRef.current !== starRolesIncludingNoStarRole) {
		// eslint-disable-next-line react-hooks/refs -- React-recommended "adjust state during render" pattern
		prevStarRolesRef.current = starRolesIncludingNoStarRole
		setActiveStarRoles(starRolesIncludingNoStarRole)
	}

	const focusedStarRole = useMemo(
		() => (activeStarRoles.length === 1 && activeStarRoles[0]) || null,
		[activeStarRoles],
	)
	const allStarRolesActive =
		activeStarRoles.length === starRolesIncludingNoStarRole.length

	const inActiveStarRoles = useCallback(
		(todo: Todo) => {
			if (todo.starRole === 'str0PBouoSd4NWkh6Em771Nj0Ojcom') {
				console.debug('in active star role', {
					todo,
					allStarRolesActive,
					activeStarRoles,
				})
			}
			if (allStarRolesActive) return true
			if (!todo.starRole && activeStarRoles.includes('')) return true
			if (!todo.starRole) return false
			return activeStarRoles.includes(todo.starRole)
		},
		[activeStarRoles, allStarRolesActive],
	)
	const activateAllStarRoles = useCallback(() => {
		setActiveStarRoles([...starRoles!.map(({ id }) => id), ''])
	}, [setActiveStarRoles, starRoles])

	return (
		<ViewContext.Provider
			value={{
				activeStarRoles,
				activateAllStarRoles,
				activateStarRole: id => {
					console.debug('Activating')
					setActiveStarRoles(prev => [...prev, id])
				},
				allStarRolesActive,
				deactivateStarRole: id => {
					console.debug('Deactivating')
					setActiveStarRoles(prev => prev?.filter(activeId => activeId !== id))
				},
				focusedStarRole,
				inActiveStarRoles,
				setActiveStarRoles,
				starRolesCount: starRoles?.length || 0,
				query,
				setQuery,
			}}
		>
			{children}
		</ViewContext.Provider>
	)
}

export default function useView() {
	return useContext(ViewContext)
}
