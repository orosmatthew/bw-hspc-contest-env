<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

{#each data.teams as team}
	<table class="table table-bordered table-striped">
		<thead>
			<tr>
				<th>ID</th>
				<th>Team Name</th>
				<th>Password</th></tr
			>
		</thead>
		<tbody>
			<tr><td>{team.id}</td><td>{team.name}</td><td>{team.password}</td></tr>
		</tbody>
	</table>
{/each}
