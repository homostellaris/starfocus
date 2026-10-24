import { expect, test } from 'bun:test'
import HelpIcon from './HelpIcon'

test('renders with resting state when isOpen is false', () => {
	const element = HelpIcon({ isOpen: false })
	expect(element.props['data-active']).toBe('false')
	expect(element.props['data-animation']).toBe('none')
	expect(element.props['data-testid']).toBe('help-icon')
	expect(element.props.className).toContain('text-neutral-400')
	expect(element.props.className).not.toContain('animate-curious-beacon')
})

test('renders with active curious beacon animation when isOpen is true', () => {
	const element = HelpIcon({ isOpen: true })
	expect(element.props['data-active']).toBe('true')
	expect(element.props['data-animation']).toBe('curious-beacon')
	expect(element.props.className).toContain('animate-curious-beacon')
	expect(element.props.className).toContain('text-sky-400')
})

test('applies custom test identifier and className', () => {
	const element = HelpIcon({
		isOpen: true,
		className: 'custom-class',
		'data-testid': 'custom-help-icon',
	})
	expect(element.props['data-testid']).toBe('custom-help-icon')
	expect(element.props.className).toContain('custom-class')
	expect(element.props.className).toContain('animate-curious-beacon')
})

test('resolves semantic size tokens and custom numeric sizes', () => {
	const smElement = HelpIcon({ size: 'sm' })
	expect(smElement.props.style?.fontSize).toBe('16px')

	const lgElement = HelpIcon({ size: 'lg' })
	expect(lgElement.props.style?.fontSize).toBe('32px')

	const numericElement = HelpIcon({ size: 40 })
	expect(numericElement.props.style?.fontSize).toBe('40px')
})

test('defaults to resting state when isOpen is omitted', () => {
	const element = HelpIcon({})
	expect(element.props['data-active']).toBe('false')
	expect(element.props['data-animation']).toBe('none')
})

test('handles invalid size gracefully without throwing', () => {
	const element = HelpIcon({ size: 'invalid' as any })
	expect(element.props.style?.fontSize).toBeUndefined()
})
