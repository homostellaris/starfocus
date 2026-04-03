import { FileOperations } from './sync'

const FS_TIMEOUT_MS = 10_000

class FileSystemTimeoutError extends Error {
	constructor(operation: string) {
		super(`File system operation timed out: ${operation}`)
		this.name = 'FileSystemTimeoutError'
	}
}

function withTimeout<T>(promise: Promise<T>, operation: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(
				() => reject(new FileSystemTimeoutError(operation)),
				FS_TIMEOUT_MS,
			),
		),
	])
}

/**
 * File System Access API service for managing markdown export directory
 */

export interface FileSystemService {
	isSupported: boolean
	hasDirectoryHandle: () => Promise<boolean>
	requestDirectory: () => Promise<FileSystemDirectoryHandle | null>
	getStoredDirectory: () => Promise<FileSystemDirectoryHandle | null>
	writeFile: (filename: string, content: string) => Promise<boolean>
	deleteFile: (filename: string) => Promise<boolean>
	listFiles: () => Promise<string[]>
	clearStoredDirectory: () => Promise<void>
}

const DIRECTORY_HANDLE_KEY = 'starfocus-export-directory'
const DB_NAME = 'starfocus-file-handles'
const STORE_NAME = 'handles'

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'showDirectoryPicker' in window &&
		typeof (window as Window).showDirectoryPicker === 'function'
	)
}

/**
 * Request a directory from the user
 */
export async function requestDirectory(): Promise<FileSystemDirectoryHandle | null> {
	if (!isFileSystemAccessSupported()) {
		console.warn('File System Access API is not supported')
		return null
	}

	try {
		const handle = await (window as Window).showDirectoryPicker({
			id: 'starfocus-export',
			mode: 'readwrite',
			startIn: 'documents',
		})

		// Store the handle for persistence
		await storeDirectoryHandle(handle)

		return handle
	} catch (error) {
		if ((error as Error).name === 'AbortError') {
			// User cancelled the picker
			return null
		}
		console.error('Error requesting directory:', error)
		throw error
	}
}

/**
 * Store directory handle in IndexedDB for persistence
 */
async function storeDirectoryHandle(
	handle: FileSystemDirectoryHandle,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1)

		request.onerror = () => reject(request.error)

		request.onupgradeneeded = () => {
			const db = request.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME)
			}
		}

		request.onsuccess = () => {
			const db = request.result
			const tx = db.transaction(STORE_NAME, 'readwrite')
			const store = tx.objectStore(STORE_NAME)
			const putRequest = store.put(handle, DIRECTORY_HANDLE_KEY)

			putRequest.onerror = () => reject(putRequest.error)
			tx.oncomplete = () => {
				db.close()
				resolve()
			}
		}
	})
}

/**
 * Retrieve stored directory handle from IndexedDB without any permission checks.
 */
export async function getHandleFromStorage(): Promise<FileSystemDirectoryHandle | null> {
	if (!isFileSystemAccessSupported()) {
		return null
	}

	try {
		return await new Promise<FileSystemDirectoryHandle | null>(
			(resolve, reject) => {
				const request = indexedDB.open(DB_NAME, 1)

				request.onerror = () => reject(request.error)

				request.onupgradeneeded = () => {
					const db = request.result
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						db.createObjectStore(STORE_NAME)
					}
				}

				request.onsuccess = () => {
					const db = request.result
					const tx = db.transaction(STORE_NAME, 'readonly')
					const store = tx.objectStore(STORE_NAME)
					const getRequest = store.get(DIRECTORY_HANDLE_KEY)

					getRequest.onerror = () => {
						db.close()
						reject(getRequest.error)
					}
					getRequest.onsuccess = () => {
						db.close()
						resolve(getRequest.result || null)
					}
				}
			},
		)
	} catch (error) {
		console.error('Error retrieving stored directory handle:', error)
		return null
	}
}

export type PermissionResult = 'granted' | 'denied' | 'prompt'

/**
 * Check permission on a handle. When allowRequest is false, returns 'prompt'
 * instead of calling requestPermission (which hangs without a user gesture on
 * Android Chrome). When allowRequest is true, wraps requestPermission in a
 * 5-second timeout.
 */
export async function checkPermission(
	handle: FileSystemDirectoryHandle,
	{ allowRequest }: { allowRequest: boolean },
): Promise<PermissionResult> {
	const current = await handle.queryPermission({ mode: 'readwrite' })
	if (current === 'granted') return 'granted'
	if (current === 'denied') return 'denied'

	if (!allowRequest) return 'prompt'

	const TIMEOUT_MS = 5_000
	const result = await Promise.race([
		handle.requestPermission({ mode: 'readwrite' }),
		new Promise<'prompt'>(resolve =>
			setTimeout(() => resolve('prompt'), TIMEOUT_MS),
		),
	])

	return result as PermissionResult
}

/**
 * Retrieve stored directory handle from IndexedDB and verify permission.
 * Kept for any remaining callers — prefers the split getHandleFromStorage +
 * checkPermission flow for new code.
 */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
	const handle = await getHandleFromStorage()
	if (!handle) return null

	try {
		const permission = await checkPermission(handle, { allowRequest: true })
		if (permission === 'granted') return handle

		await clearStoredDirectoryHandle()
		return null
	} catch (error) {
		console.error('Error verifying directory handle permission:', error)
		return null
	}
}

/**
 * Clear stored directory handle
 */
export async function clearStoredDirectoryHandle(): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1)

		request.onerror = () => reject(request.error)

		request.onupgradeneeded = () => {
			const db = request.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME)
			}
		}

		request.onsuccess = () => {
			const db = request.result
			const tx = db.transaction(STORE_NAME, 'readwrite')
			const store = tx.objectStore(STORE_NAME)
			const deleteRequest = store.delete(DIRECTORY_HANDLE_KEY)

			deleteRequest.onerror = () => {
				db.close()
				reject(deleteRequest.error)
			}
			tx.oncomplete = () => {
				db.close()
				resolve()
			}
		}
	})
}

/**
 * Check if we have a valid stored directory handle
 */
export async function hasValidDirectoryHandle(): Promise<boolean> {
	const handle = await getStoredDirectoryHandle()
	return handle !== null
}

/**
 * Write a file to the export directory
 */
export async function writeFile(
	filename: string,
	content: string,
): Promise<boolean> {
	const handle = await getStoredDirectoryHandle()
	if (!handle) {
		console.warn('No directory handle available')
		return false
	}

	try {
		const fileHandle = await handle.getFileHandle(filename, { create: true })
		const writable = await fileHandle.createWritable()
		await writable.write(content)
		await writable.close()
		return true
	} catch (error) {
		console.error('Error writing file:', error)
		return false
	}
}

/**
 * Delete a file from the export directory
 */
export async function deleteFile(filename: string): Promise<boolean> {
	const handle = await getStoredDirectoryHandle()
	if (!handle) {
		console.warn('No directory handle available')
		return false
	}

	try {
		await handle.removeEntry(filename)
		return true
	} catch (error) {
		if ((error as Error).name === 'NotFoundError') {
			// File doesn't exist, which is fine
			return true
		}
		console.error('Error deleting file:', error)
		return false
	}
}

/**
 * List all markdown files in the export directory
 */
export async function listFiles(): Promise<string[]> {
	const handle = await getStoredDirectoryHandle()
	if (!handle) {
		return []
	}

	try {
		const files: string[] = []
		for await (const entry of handle.values()) {
			if (entry.kind === 'file' && entry.name.endsWith('.md')) {
				files.push(entry.name)
			}
		}
		return files
	} catch (error) {
		console.error('Error listing files:', error)
		return []
	}
}

/**
 * Write multiple files at once
 */
export async function writeFiles(
	files: Array<{ filename: string; content: string }>,
): Promise<{ success: number; failed: number }> {
	let success = 0
	let failed = 0

	for (const file of files) {
		const result = await writeFile(file.filename, file.content)
		if (result) {
			success++
		} else {
			failed++
		}
	}

	return { success, failed }
}

/**
 * Sync files - write new/updated files and optionally remove deleted ones
 */
export async function syncFiles(
	files: Array<{ filename: string; content: string }>,
	removeOrphaned: boolean = false,
): Promise<{ written: number; deleted: number; failed: number }> {
	const handle = await getStoredDirectoryHandle()
	if (!handle) {
		return { written: 0, deleted: 0, failed: 0 }
	}

	let written = 0
	let deleted = 0
	let failed = 0

	// Get existing files
	const existingFiles = new Set(await listFiles())

	// Write all files
	for (const file of files) {
		const result = await writeFile(file.filename, file.content)
		if (result) {
			written++
			existingFiles.delete(file.filename)
		} else {
			failed++
		}
	}

	// Remove orphaned files if requested
	if (removeOrphaned) {
		const orphanedFilesArray = Array.from(existingFiles)
		for (const orphanedFile of orphanedFilesArray) {
			// Don't delete the manifest
			if (orphanedFile === '_manifest.md') continue

			const result = await deleteFile(orphanedFile)
			if (result) {
				deleted++
			} else {
				failed++
			}
		}
	}

	return { written, deleted, failed }
}

export async function readFile(filename: string): Promise<string | null> {
	const handle = await getStoredDirectoryHandle()
	if (!handle) {
		return null
	}

	try {
		const fileHandle = await handle.getFileHandle(filename)
		const file = await fileHandle.getFile()
		return await file.text()
	} catch (error) {
		if ((error as Error).name === 'NotFoundError') {
			return null
		}
		console.error('Error reading file:', error)
		return null
	}
}

async function resolveDir(
	root: FileSystemDirectoryHandle,
	filepath: string,
	create: boolean,
): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
	const parts = filepath.split('/')
	const name = parts.pop()!
	let dir = root
	for (const part of parts) {
		dir = await withTimeout(
			dir.getDirectoryHandle(part, { create }),
			`resolveDir.getDirectoryHandle(${part})`,
		)
	}
	return { dir, name }
}

export function createFileOperations(
	handle: FileSystemDirectoryHandle,
): FileOperations {
	return {
		async readFile(filename: string): Promise<string | null> {
			try {
				console.debug('[FS] readFile: getFileHandle', filename)
				const { dir, name } = await resolveDir(handle, filename, false)
				const fileHandle = await withTimeout(
					dir.getFileHandle(name),
					`readFile.getFileHandle(${filename})`,
				)
				console.debug('[FS] readFile: getFile', filename)
				const file = await withTimeout(
					fileHandle.getFile(),
					`readFile.getFile(${filename})`,
				)
				console.debug('[FS] readFile: text', filename)
				return await withTimeout(file.text(), `readFile.text(${filename})`)
			} catch (error) {
				if ((error as Error).name === 'NotFoundError') return null
				console.error('Error reading file:', error)
				return null
			}
		},
		async writeFile(filename: string, content: string): Promise<boolean> {
			try {
				console.debug('[FS] writeFile: getFileHandle', filename)
				const { dir, name } = await resolveDir(handle, filename, true)
				const fileHandle = await withTimeout(
					dir.getFileHandle(name, { create: true }),
					`writeFile.getFileHandle(${filename})`,
				)
				console.debug('[FS] writeFile: createWritable', filename)
				const writable = await withTimeout(
					fileHandle.createWritable(),
					`writeFile.createWritable(${filename})`,
				)
				console.debug('[FS] writeFile: write', filename)
				await withTimeout(
					writable.write(content),
					`writeFile.write(${filename})`,
				)
				// Explicitly truncate to the written byte length.
				// createWritable() is supposed to truncate by default but
				// Capacitor's implementation may not, leaving trailing bytes
				// from a previous longer write which causes duplicate YAML keys.
				console.debug('[FS] writeFile: truncate', filename)
				const byteLength = new TextEncoder().encode(content).length
				await withTimeout(
					writable.truncate(byteLength),
					`writeFile.truncate(${filename})`,
				)
				console.debug('[FS] writeFile: close', filename)
				await withTimeout(writable.close(), `writeFile.close(${filename})`)
				return true
			} catch (error) {
				console.error('Error writing file:', error)
				return false
			}
		},
		async deleteFile(filename: string): Promise<boolean> {
			try {
				console.debug('[FS] deleteFile: removeEntry', filename)
				const { dir, name } = await resolveDir(handle, filename, false)
				await withTimeout(
					dir.removeEntry(name),
					`deleteFile.removeEntry(${filename})`,
				)
				return true
			} catch (error) {
				if ((error as Error).name === 'NotFoundError') return true
				console.error('Error deleting file:', error)
				return false
			}
		},
		async listFiles(): Promise<string[]> {
			try {
				console.debug('[FS] listFiles: iterating handle.values()')
				const files: string[] = []
				const iterator = handle.values()
				let done = false
				while (!done) {
					const result = await withTimeout(iterator.next(), 'listFiles.next()')
					if (result.done) {
						done = true
					} else {
						const entry = result.value
						console.debug('[FS] listFiles: entry', entry.name)
						if (entry.kind === 'file' && entry.name.endsWith('.md')) {
							files.push(entry.name)
						}
					}
				}
				return files
			} catch (error) {
				console.error('Error listing files:', error)
				return []
			}
		},
	}
}
