<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionData } from './$types';
	export let form: ActionData;

	$: if (browser) {
		if (form && form.success) {
			goto('/admin/reviews');
		}
	}
</script>

<div class="mt-4 row justify-content-center">
	<div class="col-4">
		<h1>Login</h1>
		<form method="POST" action="?/login" use:enhance>
			<label for="username_field" class="form-label">Username</label>
			<input type="text" name="username" class="form-control" id="username_field" />

			<label for="password_field" class="form-label">Password</label>
			<input type="password" name="password" class="form-control" id="password_field" />

			<div class="mt-2">
				<button type="submit" class="btn btn-primary">Login</button>
			</div>
		</form>
		<div class="mt-2">
			{#if form?.success}
				<div class="alert alert-success" role="alert">Success!</div>
			{:else if form && !form.success}
				<div class="alert alert-danger" role="alert">Invalid login</div>
			{/if}
		</div>
	</div>
</div>
