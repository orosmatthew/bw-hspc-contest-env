<script lang="ts" context="module">
	import { writable } from 'svelte/store';
	const tabs = [
		'Inspector',
		'Team Code',
		'Line Diff',
		'Case Diff',
		'Basic Diff',
		'Raw Output',
		'Raw Input'
	] as const;
	export type Tab = (typeof tabs)[number];
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
