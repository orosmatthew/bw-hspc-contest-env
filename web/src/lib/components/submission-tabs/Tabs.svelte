<script lang="ts" module>
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

<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<ul class="nav nav-tabs">
	{#each tabs as tab (tab)}
		<li class="nav-item">
			<button
				onclick={() => {
					$selectedTab = tab;
				}}
				class="nav-link"
				class:active={tab === $selectedTab}>{tab}</button
			>
		</li>
	{/each}
</ul>

{@render children?.()}
