<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { theme } from '../stores';
	import { page } from '$app/stores';
	import { selectedContest } from './stores';
	import type { LayoutData } from './$types';
	import { browser } from '$app/environment';

	export let data: LayoutData;

	$selectedContest = data.selectedContestId;

	selectedContest.subscribe((id) => {
		const url = $page.url;
		if (typeof id === 'number') {
			url.searchParams.delete('c');
			url.searchParams.append('c', id.toString());
		} else {
			url.searchParams.delete('c');
		}
		if (browser) {
			goto(url, { replaceState: true, noScroll: true, keepFocus: true, invalidateAll: true });
		}
	});

	beforeNavigate(({ to }) => {
		if (
			$selectedContest !== null &&
			to !== null &&
			to.url.pathname.startsWith('/admin') &&
			!isNaN($selectedContest)
		) {
			to.url.searchParams.set('c', $selectedContest.toString());
		} else {
			$selectedContest = null;
		}
	});

	let selectContestValue: string;
	function onSelectContest() {
		if (selectContestValue === 'null') {
			$selectedContest = null;
		} else {
			$selectedContest = parseInt(selectContestValue);
		}
	}
</script>

<nav class="main-nav mt-2 mb-3 navbar navbar-expand-xl bg-body-secondary shadow-sm">
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
					<a href="/admin/teams" class="nav-link"><i class="bi bi-people"></i> Teams</a>
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
					<a href="/admin/contests" class="nav-link"><i class="bi bi-flag"></i> Contests</a>
				</li>
			</ul>
		</div>
	</div>

	<div class="nav-sticky-right">
		<select
			class="form-control form-select w-auto"
			bind:value={selectContestValue}
			on:change={onSelectContest}
		>
			{#if $selectedContest === null}
				<option value={null} selected>Select Contest</option>
			{/if}
			{#each data.contests as contest}
				<option value={contest.id} selected={$selectedContest === contest.id}>{contest.name}</option
				>
			{/each}
		</select>
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
		display: flex;
		column-gap: 5px;
		right: 10px;
		top: 8px;
	}
</style>
