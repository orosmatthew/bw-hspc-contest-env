<script lang="ts">
	import { selectedTab, type Tab } from './Tabs.svelte';

	export let tab: Tab;
	$: isSelected = tab === $selectedTab;
</script>

{#if isSelected}
	<slot />
{/if}
