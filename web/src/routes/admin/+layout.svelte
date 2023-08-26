<script lang="ts">
	import { goto } from '$app/navigation';

	async function onLogout() {
		const res = await fetch('/logout', { method: 'POST' });
		if (res.status === 200) {
			const resData = await res.json();
			if (resData.success === true) {
				goto('/login');
			}
		}
	}
</script>

<header style="font-size: 24px" class="mt-2 d-flex align-items-center justify-content-center">
	<ul class="nav col-12 col-md-auto justify-content-center">
		<li><a href="/admin" class="nav-link px-2">Home</a></li>
		<li><a href="/admin/reviews" class="nav-link px-2">Reviews</a></li>
		<li><a href="/admin/submissions" class="nav-link px-2">Submissions</a></li>
		<li><a href="/admin/problems" class="nav-link px-2">Problems</a></li>
		<li><a href="/admin/scoreboard" class="nav-link px-2">Scoreboards</a></li>
		<li><a href="/admin/teams" class="nav-link px-2">Teams</a></li>
		<li><a href="/admin/contests" class="nav-link px-2">Contests</a></li>
		<li><button on:click={onLogout} class="nav-link px-2">Logout</button></li>
	</ul>
</header>
<hr />
<slot />
<div style="height: 100px" />
