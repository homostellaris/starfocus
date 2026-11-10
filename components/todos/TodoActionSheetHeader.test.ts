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

		// Children contain celestial body, star points, title, and right-aligned star role container
		const children = element.props.children
		expect(children).toBeDefined()
		const titleChild = children.find(
			(child: any) => child?.props?.['data-testid'] === 'todo-action-sheet-title',
		)
		expect(titleChild.props.className).toContain('flex-1')
		expect(titleChild.props.className).toContain('min-w-0')

		const rightContainer = children[children.length - 1]
		expect(rightContainer.props.className).toContain('ml-auto')
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
