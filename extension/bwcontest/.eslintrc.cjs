module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		es2017: true,
		node: true
	},
	overrides: [
		{ files: ['*.ts', '*.svelte'], rules: { 'no-undef': 'off' } },
		{
			files: ['*.ts'],
			rules: {
				'@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }]
			},
			parserOptions: { project: ['./tsconfig.json', './webviews/tsconfig.json'] }
		},
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	]
};
