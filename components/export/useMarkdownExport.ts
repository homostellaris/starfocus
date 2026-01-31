import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import debounce from 'debounce'
import { db, Todo, StarRole, StarRoleGroup, Visit } from '../db'
import {
	todoToMarkdown,
	generateFilename,
	createManifest,
	TodoWithRelations,
	MarkdownExportOptions,
} from './markdown'
import {
	isFileSystemAccessSupported,
	requestDirectory,
	getStoredDirectoryHandle,
	clearStoredDirectoryHandle,
	syncFiles,
} from './fileSystem'

export interface ExportStatus {
	isSupported: boolean
	isEnabled: boolean
	isSyncing: boolean
	lastSyncAt: Date | null
	lastSyncResult: {
		written: number
		deleted: number
		failed: number
	} | null
	error: string | null
	directoryName: string | null
}

export interface UseMarkdownExportReturn {
	status: ExportStatus
	enable: () => Promise<boolean>
	disable: () => Promise<void>
	syncNow: () => Promise<void>
	exportOnce: () => Promise<void>
}

const SYNC_DEBOUNCE_MS = 2000

export default function useMarkdownExport(): UseMarkdownExportReturn {
	const [status, setStatus] = useState<ExportStatus>({
		isSupported: false,
		isEnabled: false,
		isSyncing: false,
		lastSyncAt: null,
		lastSyncResult: null,
		error: null,
		directoryName: null,
	})

	// Track if sync is enabled via ref to avoid stale closures
	const syncEnabledRef = useRef(false)

	// Check for File System Access API support on mount
	useEffect(() => {
		const supported = isFileSystemAccessSupported()
		setStatus(s => ({ ...s, isSupported: supported }))

		// Check if we have a stored directory handle
		if (supported) {
			getStoredDirectoryHandle().then(handle => {
				if (handle) {
					setStatus(s => ({
						...s,
						isEnabled: true,
						directoryName: handle.name,
					}))
					syncEnabledRef.current = true
				}
			})
		}
	}, [])

	// Subscribe to database changes
	const todos = useLiveQuery(() => db.todos.toArray(), [], [])
	const starRoles = useLiveQuery(() => db.starRoles.toArray(), [], [])
	const starRoleGroups = useLiveQuery(() => db.starRoleGroups.toArray(), [], [])
	const visits = useLiveQuery(() => db.visits.toArray(), [], [])

	// Debounced sync function
	const debouncedSync = useRef(
		debounce(async (
			todos: Todo[],
			starRoles: StarRole[],
			starRoleGroups: StarRoleGroup[],
			visits: Visit[],
		) => {
			if (!syncEnabledRef.current) return

			setStatus(s => ({ ...s, isSyncing: true, error: null }))

			try {
				const result = await performSync(
					todos,
					starRoles,
					starRoleGroups,
					visits,
					{ includeCompleted: true, includeVisits: true },
				)

				setStatus(s => ({
					...s,
					isSyncing: false,
					lastSyncAt: new Date(),
					lastSyncResult: result,
				}))
			} catch (error) {
				setStatus(s => ({
					...s,
					isSyncing: false,
					error: (error as Error).message,
				}))
			}
		}, SYNC_DEBOUNCE_MS),
	)

	// Trigger sync when data changes
	useEffect(() => {
		if (syncEnabledRef.current && todos.length > 0) {
			debouncedSync.current(todos, starRoles, starRoleGroups, visits)
		}
	}, [todos, starRoles, starRoleGroups, visits])

	const enable = useCallback(async (): Promise<boolean> => {
		const handle = await requestDirectory()
		if (handle) {
			setStatus(s => ({
				...s,
				isEnabled: true,
				directoryName: handle.name,
				error: null,
			}))
			syncEnabledRef.current = true

			// Perform initial sync
			if (todos.length > 0) {
				debouncedSync.current(todos, starRoles, starRoleGroups, visits)
			}

			return true
		}
		return false
	}, [todos, starRoles, starRoleGroups, visits])

	const disable = useCallback(async (): Promise<void> => {
		await clearStoredDirectoryHandle()
		syncEnabledRef.current = false
		setStatus(s => ({
			...s,
			isEnabled: false,
			directoryName: null,
			lastSyncAt: null,
			lastSyncResult: null,
		}))
	}, [])

	const syncNow = useCallback(async (): Promise<void> => {
		if (!syncEnabledRef.current) {
			throw new Error('Export is not enabled')
		}

		setStatus(s => ({ ...s, isSyncing: true, error: null }))

		try {
			const result = await performSync(
				todos,
				starRoles,
				starRoleGroups,
				visits,
				{ includeCompleted: true, includeVisits: true },
			)

			setStatus(s => ({
				...s,
				isSyncing: false,
				lastSyncAt: new Date(),
				lastSyncResult: result,
			}))
		} catch (error) {
			setStatus(s => ({
				...s,
				isSyncing: false,
				error: (error as Error).message,
			}))
			throw error
		}
	}, [todos, starRoles, starRoleGroups, visits])

	const exportOnce = useCallback(async (): Promise<void> => {
		// Request a directory just for this export
		const handle = await requestDirectory()
		if (!handle) {
			throw new Error('No directory selected')
		}

		setStatus(s => ({ ...s, isSyncing: true, error: null }))

		try {
			const result = await performSync(
				todos,
				starRoles,
				starRoleGroups,
				visits,
				{ includeCompleted: true, includeVisits: true },
			)

			setStatus(s => ({
				...s,
				isSyncing: false,
				lastSyncAt: new Date(),
				lastSyncResult: result,
			}))

			// Don't keep the directory for ongoing sync
			await clearStoredDirectoryHandle()
			setStatus(s => ({ ...s, isEnabled: false, directoryName: null }))
		} catch (error) {
			setStatus(s => ({
				...s,
				isSyncing: false,
				error: (error as Error).message,
			}))
			throw error
		}
	}, [todos, starRoles, starRoleGroups, visits])

	return {
		status,
		enable,
		disable,
		syncNow,
		exportOnce,
	}
}

async function performSync(
	todos: Todo[],
	starRoles: StarRole[],
	starRoleGroups: StarRoleGroup[],
	visits: Visit[],
	options: MarkdownExportOptions,
): Promise<{ written: number; deleted: number; failed: number }> {
	// Build lookup maps
	const starRolesById = new Map(starRoles.map(sr => [sr.id, sr]))
	const starRoleGroupsById = new Map(starRoleGroups.map(g => [g.id, g]))
	const visitsByTodoId = visits.reduce(
		(acc, v) => {
			if (!acc[v.todoId]) acc[v.todoId] = []
			acc[v.todoId].push(v)
			return acc
		},
		{} as Record<string, Visit[]>,
	)

	// Enrich todos with related data
	const enrichedTodos: TodoWithRelations[] = todos.map(todo => {
		const starRoleData = todo.starRole
			? starRolesById.get(todo.starRole)
			: undefined
		const starRoleGroupData = starRoleData?.starRoleGroupId
			? starRoleGroupsById.get(starRoleData.starRoleGroupId)
			: undefined

		return {
			...todo,
			starRoleData,
			starRoleGroupData,
			visitsData: visitsByTodoId[todo.id] || [],
		}
	})

	// Generate markdown files
	const files = enrichedTodos.map(todo => ({
		filename: generateFilename(todo),
		content: todoToMarkdown(todo, options),
	}))

	// Add manifest file
	const manifest = createManifest(enrichedTodos, starRoles, starRoleGroups)
	files.push({
		filename: '_manifest.md',
		content: manifest,
	})

	// Sync files to directory
	const result = await syncFiles(files, true)

	console.debug('Markdown export sync completed:', result)

	return result
}
