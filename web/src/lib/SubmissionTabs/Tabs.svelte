<script lang="ts" context="module">
	import { writable } from 'svelte/store';
	import { z } from 'zod';
	const tabs = [
		'Inspector',
		'Team Code',
		'Line Diff',
		'Case Diff',
		'Old Diff',
		'Raw Output',
		'Raw Input'
	] as const;
	const tabType = z.enum(tabs);
	export type Tab = z.infer<typeof tabType>;
	export const selectedTab = writable<Tab>('Inspector');
</script>

<ul class="nav nav-tabs">
	{#each tabs as tab}
		<li class="nav-item">
			<button
				on:click={() => {
					$selectedTab = tab;
				}}
				class="nav-link"
				class:active={tab === $selectedTab}>{tab}</button
			>
		</li>
	{/each}
</ul>

<slot />
