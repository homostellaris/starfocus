import Obsidian from './Obsidian'
import { describe, test, expect } from 'bun:test'

describe('createNoteUri', () => {
	test('should return the correct uri', () => {
		const obsidian = new Obsidian('My Vault', 'My Todo Notes')
		const todo = {
			id: '123',
			title: 'Todo Title',
			noteInitialContent: "Here's somee content",
		}
		const expectedUri = `obsidian://new?file=My%20Todo%20Notes%2FTodo%20Title&vault=My%20Vault&content=Here's%20somee%20content`
		expect(obsidian.getCreateNoteUri(todo)).toEqual(expectedUri)
	})
})

describe('createNoteUri', () => {
	test('should return the correct uri', () => {
		const obsidian = new Obsidian('My Vault', 'My Todo Notes')
		const todo = {
			id: '123',
			title: 'Todo Title',
			noteInitialContent: "Here's somee content",
		}
		const expectedUri = `obsidian://open?file=My%20Todo%20Notes%2FTodo%20Title&vault=My%20Vault`
		expect(obsidian.getOpenNoteUri(todo)).toEqual(expectedUri)
	})
})
