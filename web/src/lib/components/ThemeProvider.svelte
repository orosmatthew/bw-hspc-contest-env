<script lang="ts" module>
	export const theme: { value: 'light' | 'dark' } = $state({ value: 'light' });
</script>

<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		if (localStorage.getItem('theme') === null) {
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				theme.value = 'dark';
			}
		} else if (localStorage.getItem('theme') === 'dark') {
			theme.value = 'dark';
		} else {
			theme.value = 'light';
		}
	});

	$effect(() => {
		if (theme.value === 'dark') {
			document.documentElement.setAttribute('data-bs-theme', 'dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-bs-theme', 'light');
			localStorage.setItem('theme', 'light');
		}
	});
</script>

<svelte:head>
	<script>
		if (localStorage.getItem('theme') === 'dark') {
			document.documentElement.setAttribute('data-bs-theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-bs-theme', 'light');
		}
	</script>
</svelte:head>
