<script lang="ts">
	import 'bootstrap/dist/css/bootstrap.min.css';
	import '$lib/styles/global.css';
	import { onMount } from 'svelte';
	import type { LayoutData } from './$types';
	import { theme } from './stores';
	import { browser } from '$app/environment';
	import Cookies from 'js-cookie';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';

	onMount(async () => {
		await import('bootstrap');
	});

	export let data: LayoutData;

	$theme = data.theme;

	if (browser) {
		theme.subscribe((value) => {
			document.getElementById('html-element')?.setAttribute('data-bs-theme', value);
			Cookies.set('theme', value, { sameSite: 'strict' });
		});
	}
</script>

<body class="container">
	<slot />
</body>
