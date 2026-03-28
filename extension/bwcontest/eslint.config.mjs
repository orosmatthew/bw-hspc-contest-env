import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			parserOptions: {
				projectService: true,
				parser: ts.parser
			}
		},
		rules: {
			'no-undef': 'off',
			'svelte/no-navigation-without-resolve': 'off',
			eqeqeq: 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/strict-boolean-expressions': 'error',
			'@typescript-eslint/await-thenable': 'error',
			'@typescript-eslint/no-unnecessary-type-assertion': 'error',
			'@typescript-eslint/prefer-nullish-coalescing': 'error'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},
	{
		files: ['src/**/*.ts', 'shared/**/*.ts', '*.mjs', '*.js'],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	{
		files: ['webviews/**/*.ts', 'webviews/**/*.svelte', 'webviews/**/*.js'],
		languageOptions: {
			globals: {
				...globals.browser
			}
		}
	},
	{
		ignores: ['out/', 'dist/', 'media/', '.vscode-test/']
	}
);
