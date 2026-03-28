import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['src/**/*.ts'],
	format: ['cjs', 'esm'],
	dts: true,
	splitting: false,
	clean: true,
	outDir: 'dist'
});
