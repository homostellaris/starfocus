import { useLiveQuery } from 'dexie-react-hooks'
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
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

export function ViewProvider({ children }: { children: React.ReactNode }) {
	const [query, setQuery] = useState<string>('')

	const starRoles = useLiveQuery(() => db.starRoles.toArray())
	const [activeStarRoles, setActiveStarRoles] = useState<string[]>([])
	useEffect(() => {
		if (!starRoles) return
		/* In the rare event that a star role is added or removed we're happy to reset the state because
		   it's not clear whether the user would want the new star role to be active or not. */
		setActiveStarRoles([...starRoles.map(({ id }) => id), ''])
	}, [starRoles])
	const allStarRolesActive = activeStarRoles.length === (starRoles?.length || 0)
	const inActiveStarRoles = useCallback(
		(todo: Todo) => {
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
	const focusedStarRole = useMemo(
		() => (activeStarRoles.length === 1 && activeStarRoles[0]) || null,
		[activeStarRoles],
	)

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
