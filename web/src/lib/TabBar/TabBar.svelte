<script lang="ts" context="module">
	export const tabBarContextKey = {};
	export const tabTitleLoadedKey = "tabListContainerLoaded";
</script>

<script lang="ts">
	import TabContent from './TabContent.svelte';
	import { writable } from 'svelte/store';
	import { setContext, onMount } from 'svelte';
	import { theme } from '../../routes/stores';

	const tabList = writable<number[]>([]);
	const selectedTab = writable<number | null>(null);

	setContext(tabBarContextKey, { tabs: tabList, selectedTab });

	onMount(() => {
		if ($tabList.length > 0) $selectedTab = $tabList[0];
	});
</script>

<div class="tabList" data-bs-theme={$theme}>
	<slot />
</div>

<TabContent>
	<slot />
</TabContent>

<style>
    :root {
        --tablist-background: #f1f1f1;
	}

	[data-bs-theme='dark'] {
        --tablist-background: #161616;
    }

	.tabList {
		overflow: hidden;
		border: 1px solid #aaa;
		background-color: var(--tablist-background);
		border-radius: 5px 5px 0px 0px;
	}
</style>
