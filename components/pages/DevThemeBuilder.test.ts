import { expect, test } from 'bun:test'
import DevThemeBuilder, {
	formatRgbToHex,
	generateThemeJson,
	generateThemePromptMarkdown,
	generateThemeTypeScript,
	interpolateTierColors,
	parseHexToRgb,
	type BuilderThemeConfig,
} from './DevThemeBuilder'

const sampleConfig: BuilderThemeConfig = {
	id: 'cyber_emerald',
	name: 'Cyber Emerald',
	subtitle: 'Mint Jade → Neon Lime → Abyssal Teal',
	description: 'High-tech bioluminescent cybernetic theme',
	starColors: {
		1: '#34d399',
		2: '#2dd4bf',
		3: '#38bdf8',
		5: '#818cf8',
		8: '#a78bfa',
		13: '#c084fc',
	},
	shipSkinId: 'terran_sage',
	shipSecondaryTrim: '#2dd4bf',
}

test('DevThemeBuilder exports a valid React component function', () => {
	expect(typeof DevThemeBuilder).toBe('function')
})

test('parseHexToRgb parses standard 6-digit hex string correctly', () => {
	expect(parseHexToRgb('#34d399')).toEqual([52, 211, 153])
	expect(parseHexToRgb('#000000')).toEqual([0, 0, 0])
	expect(parseHexToRgb('#ffffff')).toEqual([255, 255, 255])
})

test('formatRgbToHex converts RGB values to lowercase hex string with hash', () => {
	expect(formatRgbToHex(52, 211, 153)).toBe('#34d399')
	expect(formatRgbToHex(0, 0, 0)).toBe('#000000')
	expect(formatRgbToHex(255, 255, 255)).toBe('#ffffff')
})

test('interpolateTierColors blends smoothly between tier 1 and tier 13 colors', () => {
	const interpolated = interpolateTierColors('#000000', '#ffffff')
	expect(interpolated[1]).toBe('#000000')
	expect(interpolated[13]).toBe('#ffffff')
	expect(interpolated[5]).toBe('#999999')
})

test('generateThemePromptMarkdown produces clear instructions for the AI assistant', () => {
	const prompt = generateThemePromptMarkdown(sampleConfig)
	expect(prompt).toContain('Please add this new theme to StarFocus:')
	expect(prompt).toContain('Cyber Emerald')
	expect(prompt).toContain('cyber_emerald')
	expect(prompt).toContain('★ 1 pt (Asteroid): `#34d399`')
	expect(prompt).toContain('★ 13 pts (Black Hole): `#c084fc`')
	expect(prompt).toContain('terran_sage')
})

test('generateThemeTypeScript outputs valid TypeScript definition format matching STAR_POINTS_THEMES', () => {
	const typescriptOutput = generateThemeTypeScript(sampleConfig)
	expect(typescriptOutput).toContain('cyber_emerald: {')
	expect(typescriptOutput).toContain("id: 'cyber_emerald',")
	expect(typescriptOutput).toContain("1: '#34d399',")
	expect(typescriptOutput).toContain("13: '#c084fc',")
	expect(typescriptOutput).toContain("shipSkinId: 'terran_sage',")
})

test('generateThemeJson outputs parseable JSON containing all required palette properties', () => {
	const jsonOutput = generateThemeJson(sampleConfig)
	const parsed = JSON.parse(jsonOutput)
	expect(parsed.id).toBe('cyber_emerald')
	expect(parsed.name).toBe('Cyber Emerald')
	expect(parsed.starColors['1']).toBe('#34d399')
	expect(parsed.starColors['13']).toBe('#c084fc')
	expect(parsed.shipPalette.secondaryTrimGreen).toBe('#2dd4bf')
})

test('parseHexToRgb handles short 3-digit hex strings gracefully', () => {
	expect(parseHexToRgb('#fff')).toEqual([255, 255, 255])
	expect(parseHexToRgb('#f00')).toEqual([255, 0, 0])
})

test('parseHexToRgb falls back to white when given an invalid hex string', () => {
	expect(parseHexToRgb('invalid-hex')).toEqual([255, 255, 255])
})
