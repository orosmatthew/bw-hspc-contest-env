<script lang="ts">
	import 'bootstrap-dark-5/dist/css/bootstrap-night.min.css';
	import { onMount } from 'svelte';

	onMount(async () => {
		await import('bootstrap');
	});
</script>

<slot />
