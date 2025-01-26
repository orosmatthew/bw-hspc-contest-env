<script lang="ts" module>
	export let selectedContest: { id: number | null } = $state({ id: null });
</script>

<script lang="ts">
	import { beforeNavigate, goto } from '$app/navigation';
	import { theme } from '../stores';
	import type { LayoutData } from './$types';
	import { page } from '$app/state';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	selectedContest.id = data.selectedContestId;

	// $effect(() => {

	// });

	beforeNavigate(({ to }) => {
		if (
			selectedContest.id !== null &&
			to !== null &&
			to.url.pathname.startsWith('/admin') &&
			!isNaN(selectedContest.id)
		) {
			to.url.searchParams.set('c', selectedContest.id.toString());
		} else {
			selectedContest.id = null;
		}
	});

	let selectContestValue: number | null = $state(selectedContest.id);
	function onSelectContest() {
		if (selectContestValue === null) {
			selectedContest.id = null;
		} else {
			selectedContest.id = selectContestValue;
		}
		const url = page.url;
		if (typeof selectedContest.id === 'number') {
			url.searchParams.delete('c');
			url.searchParams.append('c', selectedContest.id.toString());
		} else {
			url.searchParams.delete('c');
		}
		goto(url, { replaceState: true, noScroll: true, keepFocus: true, invalidateAll: true });
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
			<span class="navbar-toggler-icon"></span>
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
			onchange={onSelectContest}
		>
			{#if selectedContest.id === null}
				<option value={null}>Select Contest</option>
			{/if}
			{#each data.contests as contest}
				<option value={contest.id}>{contest.name}</option>
			{/each}
		</select>
		<button
			onclick={() => {
				$theme = $theme === 'light' ? 'dark' : 'light';
			}}
			type="button"
			aria-label="theme"
			class="btn"><i class={`bi bi-${$theme == 'light' ? 'sun' : 'moon'}`}></i></button
		>
		<button
			onclick={async () => {
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
{@render children?.()}

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
