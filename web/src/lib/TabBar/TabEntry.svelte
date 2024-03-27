<script lang="ts">
	import { tabBarContextKey, tabTitleLoadedKey } from './TabBar.svelte';
	import { getContext } from 'svelte';
	import { type Writable } from 'svelte/store';
	import { theme } from '../../routes/stores';

	export let index: number;
	export let title: string | null = null;

	const tabTitleLoaded = getContext(tabTitleLoadedKey);

	/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
	const { selectedTab, tabs } = getContext<{
		selectedTab: Writable<number>;
		tabs: Writable<number[]>;
	}>(tabBarContextKey);
	$tabs = $tabs.some((t) => t == index) ? $tabs : [...$tabs, index];

	$: isSelected = index == $selectedTab;
</script>

{#if !tabTitleLoaded}
	{#if title}
		<a href={`#tab-${index}`} on:click={() => ($selectedTab = index)}>
			<div class="individualTab" class:isSelected data-bs-theme={$theme}>
				{title ?? ' '}
			</div>
		</a>
	{:else}
		<div class="spacerTab" class:isSelected data-bs-theme={$theme}>&nbsp;</div>
	{/if}
{:else if isSelected}
	<slot />
{/if}

<style>
	:root {
		--selectedTab-background: #cccccc;
		--hoverTab-background: #dddddd;
		--tabSeparationBorder-color: #aaaaaa;
	}

	[data-bs-theme='dark'] {
		--selectedTab-background: #444444;
		--hoverTab-background: #353535;
		--tabSeparationBorder-color: #777777;
	}

	.individualTab {
		background-color: inherit;
		float: left;
		border: none;
		outline: none;
		cursor: pointer;
		padding: 10px 14px;
		transition: 0.3s;
		border-right: 1px solid var(--tabSeparationBorder-color);
		color: initial;
	}

	.individualTab:hover {
		background-color: var(--hoverTab-background);
	}

	.spacerTab {
		background-color: inherit;
		float: left;
		border: none;
		outline: none;
		cursor: default;
		padding: 10px 12px;
		transition: 0.3s;
		border-right: 1px solid var(--tabSeparationBorder-color);
	}

	.isSelected {
		background-color: var(--selectedTab-background);
	}
</style>
