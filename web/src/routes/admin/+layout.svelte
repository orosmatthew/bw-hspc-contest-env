<script lang="ts">
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';
	import { theme } from '$lib/components/ThemeProvider.svelte';
	import urlJoin from 'url-join';
	import type { FormEventHandler } from 'svelte/elements';
	import { enhance } from '$app/forms';

	interface Props {
		data: LayoutData;
		children?: import('svelte').Snippet;
	}

	let { data, children }: Props = $props();

	const onSelectContestInput: FormEventHandler<HTMLSelectElement> = async (event) => {
		if (event.currentTarget.value === '') {
			await goto('/admin');
		}
		await goto(urlJoin('/admin/contests', event.currentTarget.value));
	};
</script>

<div class="container">
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
						<a href="/admin/problems" class="nav-link"
							><i class="bi bi-question-circle"></i> Problems</a
						>
					</li>
					<li class="nav-item">
						<a href="/admin/teams" class="nav-link"><i class="bi bi-people"></i> Teams</a>
					</li>
					<li class="nav-item">
						<a href="/admin/contests" class="nav-link"><i class="bi bi-flag"></i> Contests</a>
					</li>
					<select
						class="form-control form-select w-auto"
						value={data.contest?.id ?? ''}
						oninput={onSelectContestInput}
					>
						<option value="" selected={data.contest === undefined}>Select Contest</option>
						{#each data.contests as contest (contest.id)}
							<option value={contest.id}>{contest.name}</option>
						{/each}
					</select>
					{#if data.contest !== undefined}
						<li class="nav-item">
							<a
								href={urlJoin('/admin/contests', data.contest.id.toString(), '/reviews')}
								class="nav-link"
							>
								<i class="bi bi-eye"></i>
								Reviews
							</a>
						</li>
						<li class="nav-item">
							<a
								href={urlJoin('/admin/contests', data.contest.id.toString(), '/submissions')}
								class="nav-link"
							>
								<i class="bi bi-envelope-paper"></i>
								Submissions
							</a>
						</li>
						<li class="nav-item">
							<a
								href={urlJoin('/admin/contests', data.contest.id.toString(), '/scoreboard')}
								class="nav-link"
							>
								<i class="bi bi-trophy"></i>
								Scoreboards
							</a>
						</li>
					{/if}
				</ul>
			</div>
		</div>

		<div class="nav-sticky-right">
			<button
				onclick={() => {
					theme.value = theme.value === 'light' ? 'dark' : 'light';
				}}
				type="button"
				aria-label="theme"
				class="btn"><i class={`bi bi-${theme.value === 'light' ? 'sun' : 'moon'}`}></i></button
			>
			<form action="?/logout" method="POST" class="d-inline" use:enhance>
				<button type="submit" class="btn btn-outline-secondary">Logout</button>
			</form>
		</div>
	</nav>
	{@render children?.()}
</div>

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
