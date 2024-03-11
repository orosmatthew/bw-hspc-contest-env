import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),
		alias: {
			"@submissionRunner/*": "../shared/submissionRunner/*"
		}
	},
	vitePlugin: {
		inspector: true
	}
};

export default config;
