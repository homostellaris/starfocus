import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
	{
		ignores: [
			'.next/',
			'out/',
			'node_modules/',
			'android/',
			'*.config.js',
			'*.config.mjs',
		],
	},
	...tseslint.configs.recommended,
	{
		files: ['**/*.{js,jsx,ts,tsx}'],
		plugins: {
			react: reactPlugin,
			'react-hooks': hooksPlugin,
			'@next/next': nextPlugin,
		},
		rules: {
			...reactPlugin.configs.recommended.rules,
			...hooksPlugin.configs.recommended.rules,
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs['core-web-vitals'].rules,
			'react/react-in-jsx-scope': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-unused-expressions': 'off',
			'@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
			'react-hooks/refs': 'warn',
			'react-hooks/set-state-in-effect': 'warn',
			'prefer-const': 'warn',
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
]
