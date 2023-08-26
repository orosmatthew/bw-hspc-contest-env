<script lang="ts">
	import { goto } from '$app/navigation';
	import { theme } from '../stores';
</script>

<nav class="main-nav mt-2 mb-3 navbar navbar-expand-lg bg-body-secondary">
	<div class="container-fluid">
		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#navbarSupportedContent"
			aria-controls="navbarSupportedContent"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon" />
		</button>
		<div class="collapse navbar-collapse" id="navbarSupportedContent">
			<ul class="navbar-nav me-auto mb-2 mb-lg-0">
				<li class="nav-item">
					<a href="/admin" class="nav-link"><i class="bi bi-speedometer2"></i> Dashboard</a>
				</li>
				<li class="nav-item">
					<a href="/admin/reviews" class="nav-link"><i class="bi bi-eye"></i> Reviews</a>
				</li>
				<li class="nav-item">
					<a href="/admin/submissions" class="nav-link"
						><i class="bi bi-envelope-paper"></i> Submissions</a
					>
				</li>
				<li class="nav-item">
					<a href="/admin/problems" class="nav-link"
						><i class="bi bi-question-circle"></i> Problems</a
					>
				</li>
				<li class="nav-item">
					<a href="/admin/scoreboard" class="nav-link"><i class="bi bi-trophy"></i> Scoreboards</a>
				</li>
				<li class="nav-item">
					<a href="/admin/teams" class="nav-link"><i class="bi bi-people"></i> Teams</a>
				</li>
				<li class="nav-item">
					<a href="/admin/contests" class="nav-link"><i class="bi bi-flag"></i> Contests</a>
				</li>
			</ul>
		</div>
	</div>
	<div class="nav-sticky-right">
		<button
			on:click={() => {
				$theme = $theme === 'light' ? 'dark' : 'light';
			}}
			type="button"
			aria-label="theme"
			class="btn"><i class={`bi bi-${$theme == 'light' ? 'sun' : 'moon'}`} /></button
		>
		<button
			on:click={async () => {
				const res = await fetch('/logout', { method: 'POST' });
				const data = await res.json();
				if (data.success) {
					goto('/login');
				}
			}}
			type="button"
			class="btn btn-outline-secondary">Logout</button
		>
	</div>
</nav>
<slot />

<style>
	.main-nav {
		border-radius: 10px;
		position: relative;
	}
	.nav-sticky-right {
		position: absolute;
		right: 10px;
		top: 8px;
	}
</style>
