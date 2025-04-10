<script lang="ts">
	import type { Snippet } from 'svelte';

	let props: { children: Snippet } = $props();
</script>

<div class="container">
	{@render props.children()}
</div>
