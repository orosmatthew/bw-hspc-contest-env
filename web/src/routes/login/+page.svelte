<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { Actions } from './$types';
	import { slide, fly } from 'svelte/transition';

	export let form: Actions;

	let dismissed = false;

	$: if (form) {
		if (form.success) {
			goto('/admin');
		}
		dismissed = false;
	}
</script>

<div transition:fly|global={{ y: -50 }} class="container login-modal bg-body-tertiary">
	<h1 class="mt-3 text-center">BW Contest Admin</h1>
	{#if form && !dismissed}
		<div
			transition:slide|global
			class={`mt-4 alert alert-dismissible alert-${form.success ? 'success' : 'danger'}`}
		>
			{form.success ? 'Success' : form.message ?? 'Unknown Error'}
			<button
				on:click={() => {
					dismissed = true;
				}}
				type="button"
				class="btn-close"
				aria-label="Close"
			/>
		</div>
	{/if}
	<form class="mt-4" action="?/login" method="POST" use:enhance>
		<div class="form-floating">
			<input
				name="username"
				type="text"
				class="form-control"
				id="usernameInput"
				placeholder="Username"
			/>
			<label for="usernameInput">Username</label>
		</div>
		<div class="mt-4 form-floating">
			<input
				name="password"
				type="password"
				class="form-control"
				id="passwordInput"
				placeholder="Password"
			/>
			<label for="passwordInput">Password</label>
		</div>
		<div class="d-flex flex-row mt-4 mb-4 justify-content-end">
			<button type="submit" class="btn btn-primary">Login</button>
		</div>
	</form>
</div>

<style>
	.login-modal {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 300px;
		border-radius: 10px;
	}
</style>
