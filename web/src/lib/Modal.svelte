<script lang="ts">
	import { onMount } from 'svelte';
	import type bootstrap from 'bootstrap';
	import { beforeNavigate } from '$app/navigation';

	export let title: string;
	export let closeButton = true;

	let modalElement: HTMLDivElement;
	let modal: bootstrap.Modal | undefined;

	export function show() {
		modal?.show();
	}

	export function hide() {
		modal?.hide();
	}

	onMount(async () => {
		const bootstrap = await import('bootstrap');
		modal = new bootstrap.Modal(modalElement);
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
						on:click={() => {
							modal?.hide();
						}}
						type="button"
						class="btn-close"
					/>
				{/if}
			</div>
			<slot />
		</div>
	</div>
</div>
