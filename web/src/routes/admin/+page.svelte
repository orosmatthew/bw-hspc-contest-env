<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4"><i class="bi bi-speedometer2"></i> Dashboard</h1>

<div class="row">
	<div class="col-md-6">
		<a
			target="_blank"
			class="card stats-card bg-body-tertiary stats-card-link stats-card-action"
			draggable="false"
			href="/public/scoreboard"
		>
			<h4><i class="bi bi-link-45deg"></i> Public Scoreboard</h4>
		</a>
	</div>
	<div class="col-md-6 mt-3 mt-md-0"></div>
</div>

<style>
	.stats-card {
		text-align: left;
		padding: 20px;
		border-radius: 10px;
		transform: scale(1);
		transition: 0.1s;
		text-decoration: none;
	}
	.stats-card-link {
		color: inherit;
		text-decoration: none;
		vertical-align: top;
		transform: scale(1);
		transition: 0.1s;
	}

	.stats-card-link:hover {
		transform: scale(1.02);
	}

	.stats-card-action:hover {
		cursor: pointer;
	}
</style>
