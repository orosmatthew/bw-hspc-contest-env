<script lang="ts">
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';

	let dismissed = $state(false);
	let success = $state(false);
	let message: string | undefined = $state();
	let manualPopup = $state(false);

	$effect(() => {
		if (page.form !== null) {
			manualPopup = false;
			dismissed = false;
			success = page.form.success;
			message = page.form.message;
		}
	});

	export function popup(data: { success: boolean; message?: string }) {
		dismissed = false;
		manualPopup = true;
		success = data.success;
		message = data.message;
	}
</script>

{#if (page.form !== null && dismissed === false) || (manualPopup === true && dismissed === false)}
	<div
		transition:slide|local
		class={`mt-2 mb-2 alert alert-dismissible alert-${success ? 'success' : 'danger'}`}
	>
		{success ? 'Success' : (message ?? 'Unknown error')}
		<button
			aria-label="close"
			onclick={() => {
				dismissed = true;
			}}
			type="button"
			class="btn-close"
		></button>
	</div>
{/if}
