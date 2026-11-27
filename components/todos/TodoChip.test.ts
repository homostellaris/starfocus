import { expect, test } from 'bun:test'
import React from 'react'
import { StarRole, Todo } from '../db'
import { StarRoleIcon } from '../common/StarRoleIcon'
import { TodoChip } from './TodoChip'

const captainRole: StarRole = {
	id: 'role-1',
	title: 'Captain',
	icon: { type: 'ionicon', name: 'planetOutline' },
}

const sampleTodo: Todo = {
	id: 'todo-1',
	title: 'Launch Starship',
	starPoints: 3,
	createdAt: new Date(),
}

function findStarRoleIconElement(
	node: React.ReactNode,
): React.ReactElement<React.ComponentProps<typeof StarRoleIcon>> | undefined {
	if (!React.isValidElement(node)) {
		return undefined
	}

	if (node.type === StarRoleIcon) {
		return node as React.ReactElement<React.ComponentProps<typeof StarRoleIcon>>
	}

	const children = React.Children.toArray((node.props as { children?: React.ReactNode }).children)
	for (const child of children) {
		const match = findStarRoleIconElement(child)
		if (match) {
			return match
		}
	}

	return undefined
}

test('renders prominent role icon color when starRole is provided', () => {
	const element = TodoChip({ todo: sampleTodo, starRole: captainRole })
	const iconElement = findStarRoleIconElement(element)

	expect(iconElement).toBeDefined()
	expect(iconElement?.props.className).toContain('text-neutral-300')
	expect(iconElement?.props.color).toBeUndefined()
})

test('renders muted placeholder color on icon when starRole is omitted', () => {
	const element = TodoChip({ todo: sampleTodo })
	const iconElement = findStarRoleIconElement(element)

	expect(iconElement).toBeDefined()
	expect(iconElement?.props.className).toContain('text-neutral-500')
	expect(iconElement?.props.className).not.toContain('text-neutral-300')
	expect('color' in (iconElement?.props ?? {})).toBe(true)
	expect(iconElement?.props.color).toBeUndefined()
})
