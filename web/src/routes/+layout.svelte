<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '$lib/styles/global.css';
	import { onMount } from 'svelte';
	onMount(async () => {
		await import('bootstrap');
	});
</script>

<body class="container">
	<slot />
</body>
