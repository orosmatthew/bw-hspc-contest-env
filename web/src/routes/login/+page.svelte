<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { Actions } from './$types';
	import { slide, fly } from 'svelte/transition';

	interface Props {
		form: Actions;
	}

	let { form }: Props = $props();

	let dismissed = $state(false);

	$effect(() => {
		if (form) {
			if (form.success) {
				goto('/admin');
			}
			dismissed = false;
		}
	});
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<div transition:fly|global={{ y: -50 }} class="container login-modal bg-body-tertiary">
	<h1 class="mt-3 text-center">BW Contest Admin</h1>
	{#if form && !dismissed}
		<div
			transition:slide|global
			class={`mt-4 alert alert-dismissible alert-${form.success ? 'success' : 'danger'}`}
		>
			{form.success ? 'Success' : (form.message ?? 'Unknown Error')}
			<button
				onclick={() => {
					dismissed = true;
				}}
				type="button"
				class="btn-close"
				aria-label="Close"
			></button>
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
		<div class="d-flex flex-row mt-4 mb-4 justify-content-between">
			<a href="/public/scoreboard" class="btn btn-outline-secondary"
				><i class="bi bi-link-45deg"></i> Public Scoreboard</a
			>
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
