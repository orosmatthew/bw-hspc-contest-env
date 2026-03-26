<script lang="ts">
	import { selectedTab, type Tab } from './Tabs.svelte';

	interface Props {
		tab: Tab;
		children?: import('svelte').Snippet;
	}

	let { tab, children }: Props = $props();
	let isSelected = $derived(tab === $selectedTab);
</script>

{#if isSelected}
	{@render children?.()}
{/if}
