<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '$lib/styles/global.css';
	import { onMount } from 'svelte';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';
	import ThemeProvider from '$lib/components/ThemeProvider.svelte';

	onMount(async () => {
		await import('bootstrap');
	});

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<ThemeProvider />

{@render children?.()}
