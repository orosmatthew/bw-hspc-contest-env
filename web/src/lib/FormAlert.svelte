<script lang="ts">
	import { page } from '$app/stores';
	import { afterUpdate } from 'svelte';
	import { slide } from 'svelte/transition';

	let dismissed = false;
	let success = false;
	let message: string | undefined;
	let manualPopup = false;

	$: if ($page.form !== null) {
		manualPopup = false;
		dismissed = false;
		success = $page.form.success;
		message = $page.form.message;
	}

	afterUpdate(() => {
		if ($page.form !== null) {
			success = $page.form.success;
		}
	});

	export function popup(data: { success: boolean; message?: string }) {
		dismissed = false;
		manualPopup = true;
		success = data.success;
		message = data.message;
	}
</script>

{#if ($page.form !== null && dismissed === false) || (manualPopup === true && dismissed === false)}
	<div
		transition:slide|local
		class={`mt-2 mb-2 alert alert-dismissible alert-${success ? 'success' : 'danger'}`}
	>
		{success ? 'Success' : message ?? 'Unknown error'}
		<button
			on:click={() => {
				dismissed = true;
			}}
			type="button"
			class="btn-close"
		/>
	</div>
{/if}
