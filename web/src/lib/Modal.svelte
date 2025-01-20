<script lang="ts">
	import { onMount } from 'svelte';
	import type bootstrap from 'bootstrap';
	import { beforeNavigate } from '$app/navigation';

	interface Props {
		title: string;
		closeButton?: boolean;
		children?: import('svelte').Snippet;
	}

	let { title, closeButton = true, children }: Props = $props();

	let modalElement: HTMLDivElement | undefined = $state();
	let modal: bootstrap.Modal | undefined = $state();

	export function show() {
		modal?.show();
	}

	export function hide() {
		modal?.hide();
	}

	onMount(async () => {
		const bootstrap = await import('bootstrap');
		if (modalElement !== undefined) {
			modal = new bootstrap.Modal(modalElement);
		}
	});

	beforeNavigate(() => {
		modal?.hide();
	});
</script>

<div bind:this={modalElement} class="modal fade" tabindex="-1" data-bs-backdrop="static">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h2 class="modal-title fs-5">{title}</h2>
				{#if closeButton}
					<button
						aria-label="close"
						onclick={() => {
							modal?.hide();
						}}
						type="button"
						class="btn-close"
					></button>
				{/if}
			</div>
			{@render children?.()}
		</div>
	</div>
</div>
