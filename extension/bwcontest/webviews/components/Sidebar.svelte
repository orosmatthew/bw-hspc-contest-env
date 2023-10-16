<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebviewMessageType, MessageType, TeamData } from '../../src/SidebarProvider';

	function postMessage(message: MessageType) {
		vscode.postMessage(message);
	}

	let teamname: string;
	let password: string;

	let loggedIn = false;

	let teamData: TeamData | undefined;

	function onClone() {
		if (teamData) {
			postMessage({
				msg: 'onClone',
				data: { contestId: teamData.contestId, teamId: teamData.teamId }
			});
		}
	}

	function onLogin() {
		postMessage({
			msg: 'onLogin',
			data: { teamName: teamname, password: password }
		});
	}

	function onLogout() {
		postMessage({
			msg: 'onLogout'
		});
	}

	function onTestAndSubmit() {
		postMessage({ msg: 'onTestAndSubmit' });
	}

	onMount(() => {
		postMessage({ msg: 'onStartup' });
	});

	window.addEventListener('message', (event) => {
		const m = (event as MessageEvent).data as WebviewMessageType;
		if (m.msg === 'onLogin') {
			loggedIn = true;
			teamData = m.data;
		} else if (m.msg === 'onLogout') {
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
