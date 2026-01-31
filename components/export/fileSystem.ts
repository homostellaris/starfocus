import './fileSystemTypes.d'

/**
 * File System Access API service for managing markdown export directory
 */

export interface FileSystemService {
	isSupported: boolean
	hasDirectoryHandle: () => Promise<boolean>
	requestDirectory: () => Promise<FileSystemDirectoryHandle | null>
	getStoredDirectory: () => Promise<FileSystemDirectoryHandle | null>
	writeFile: (
		filename: string,
		content: string,
	) => Promise<boolean>
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
 * Retrieve stored directory handle from IndexedDB
 */
export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
	if (!isFileSystemAccessSupported()) {
		return null
	}

	try {
		const handle = await new Promise<FileSystemDirectoryHandle | null>(
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

		if (!handle) {
			return null
		}

		// Verify we still have permission
		const permission = await handle.queryPermission({ mode: 'readwrite' })
		if (permission === 'granted') {
			return handle
		}

		// Try to request permission again
		const newPermission = await handle.requestPermission({ mode: 'readwrite' })
		if (newPermission === 'granted') {
			return handle
		}

		// Permission denied, clear the stored handle
		await clearStoredDirectoryHandle()
		return null
	} catch (error) {
		console.error('Error retrieving stored directory handle:', error)
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
