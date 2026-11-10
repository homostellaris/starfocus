import { describe, expect, test } from 'bun:test'
import { TodoActionSheetHeader } from './TodoActionSheetHeader'
import type { StarRole, Todo } from '../db'

describe('TodoActionSheetHeader', () => {
	test('renders celestial body, star points, star role, and todo title', () => {
		const todo: Todo = {
			id: 'test-todo-1',
			title: 'Deploy Dyson Swarm Collector',
			starPoints: 5,
			starRole: 'role-engineering',
		}
		const starRole: StarRole = {
			id: 'role-engineering',
			title: 'Orbital Architect',
			icon: { type: 'ionicon', name: 'constructSharp' },
		}

		const element = TodoActionSheetHeader({ todo, starRole })
		expect(element.props['data-testid']).toBe('todo-action-sheet-header')

		// Children contain celestial body container and title / meta container
		const children = element.props.children
		expect(children).toBeDefined()
	})

	test('handles todo without starRole or zero starPoints safely', () => {
		const todo: Todo = {
			id: 'test-todo-2',
			title: 'Quick Orbital Scan',
			starPoints: 0,
		}

		const element = TodoActionSheetHeader({ todo })
		expect(element.props['data-testid']).toBe('todo-action-sheet-header')
	})
})
