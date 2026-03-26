<script lang="ts">
	import { onMount } from 'svelte';
	import type bootstrap from 'bootstrap';
	import { beforeNavigate } from '$app/navigation';

	interface Props {
		modalTitle?: string;
		modalText?: string;
		children?: import('svelte').Snippet;
	}

	let {
		modalTitle = $bindable('Confirm'),
		modalText = $bindable('Are you sure?'),
		children
	}: Props = $props();

	let confirmModal: HTMLDivElement | undefined = $state();
	let modal: bootstrap.Modal | undefined;

	let confirmAction: (() => void) | undefined;
	let cancelAction: (() => void) | undefined;

	export function confirm() {
		if (confirmAction !== undefined) {
			confirmAction();
		}
	}

	export function cancel() {
		if (cancelAction !== undefined) {
			cancelAction();
		}
	}

	export async function prompt(text = 'Are you sure?', title = 'Confirm'): Promise<boolean> {
		modalText = text;
		modalTitle = title;
		if (modal === undefined) {
			return false;
		}
		modal.show();
		return new Promise((resolve) => {
			confirmAction = () => {
				resolve(true);
				modal?.hide();
			};

			cancelAction = () => {
				resolve(false);
				modal?.hide();
			};
		});
	}

	onMount(async () => {
		const bootstrap = await import('bootstrap');
		if (confirmModal !== undefined) {
			modal = new bootstrap.Modal(confirmModal);
		}
	});

	beforeNavigate(() => {
		modal?.hide();
	});
</script>

<div bind:this={confirmModal} class="modal fade" tabindex="-1" data-bs-backdrop="static">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h1 class="modal-title fs-5" id="exampleModalLabel">{modalTitle}</h1>
			</div>
			<div class="modal-body">
				{#if children}
					{@render children?.()}
				{:else}
					{modalText}
				{/if}
			</div>
			<div class="modal-footer">
				<button onclick={cancel} type="button" class="btn btn-secondary">Cancel</button>
				<button onclick={confirm} type="button" class="btn btn-primary">Confirm</button>
			</div>
		</div>
	</div>
</div>
