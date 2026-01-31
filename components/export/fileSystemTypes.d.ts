/**
 * Type declarations for File System Access API
 * These APIs are only available in Chromium-based browsers
 */

interface FileSystemHandle {
	kind: 'file' | 'directory'
	name: string
	queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
	requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>
}

interface FileSystemHandlePermissionDescriptor {
	mode?: 'read' | 'readwrite'
}

interface FileSystemFileHandle extends FileSystemHandle {
	kind: 'file'
	getFile(): Promise<File>
	createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>
}

interface FileSystemCreateWritableOptions {
	keepExistingData?: boolean
}

interface FileSystemWritableFileStream extends WritableStream {
	write(data: BufferSource | Blob | string | WriteParams): Promise<void>
	seek(position: number): Promise<void>
	truncate(size: number): Promise<void>
}

interface WriteParams {
	type: 'write' | 'seek' | 'truncate'
	data?: BufferSource | Blob | string
	position?: number
	size?: number
}

interface FileSystemDirectoryHandle extends FileSystemHandle {
	kind: 'directory'
	getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>
	getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>
	removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>
	resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>
	keys(): AsyncIterableIterator<string>
	values(): AsyncIterableIterator<FileSystemHandle>
	entries(): AsyncIterableIterator<[string, FileSystemHandle]>
	[Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>
}

interface FileSystemGetDirectoryOptions {
	create?: boolean
}

interface FileSystemGetFileOptions {
	create?: boolean
}

interface FileSystemRemoveOptions {
	recursive?: boolean
}

interface DirectoryPickerOptions {
	id?: string
	mode?: 'read' | 'readwrite'
	startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | FileSystemHandle
}

interface Window {
	showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
	showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>
	showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>
}

interface OpenFilePickerOptions {
	multiple?: boolean
	excludeAcceptAllOption?: boolean
	types?: FilePickerAcceptType[]
}

interface SaveFilePickerOptions {
	excludeAcceptAllOption?: boolean
	suggestedName?: string
	types?: FilePickerAcceptType[]
}

interface FilePickerAcceptType {
	description?: string
	accept: Record<string, string | string[]>
}
