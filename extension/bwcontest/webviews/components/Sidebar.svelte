<script lang="ts">
	import { onMount } from 'svelte';

	function postMessage(message: any) {
		vscode.postMessage(message);
	}

	let teamname: string;
	let password: string;

	let loggedIn = false;

	interface TeamData {
		teamId: number;
		contestId: number;
	}

	let teamData: TeamData | undefined;

	function onClone() {
		if (teamData) {
			postMessage({
				type: 'onClone',
				value: { contestId: teamData.contestId, teamId: teamData.teamId }
			});
		}
	}

	function onLogin() {
		postMessage({
			type: 'requestLogin',
			value: { teamname: teamname, password: password }
		});
	}

	function onLogout() {
		postMessage({
			type: 'requestLogout'
		});
	}

	function onTestAndSubmit() {
		postMessage({ type: 'onTestAndSubmit' });
	}

	onMount(() => {
		postMessage({ type: 'onStartup' });
	});

	window.addEventListener('message', (event) => {
		const message = (event as MessageEvent).data;
		if (message.type === 'onLogin') {
			loggedIn = true;
			teamData = message.value;
		} else if (message.type === 'onLogout') {
			loggedIn = false;
			teamData = undefined;
		}
	});
</script>

<h1>Contest</h1>

{#if !loggedIn}
	<label for="teamname">Team Name</label>
	<input bind:value={teamname} id="teamname" type="text" />

	<label for="password">Password</label>
	<input bind:value={password} id="password" type="password" />

	<button on:click={onLogin}>Login</button>
{:else}
	<button on:click={onLogout}>Logout</button>
	{#if teamData}
		<p>TeamID: {teamData.teamId}</p>
		<p>ContestID: {teamData.contestId}</p>
		<button on:click={onClone}>Clone and Open Repo</button>
		<button on:click={onTestAndSubmit}>Test & Submit</button>
	{/if}
{/if}
