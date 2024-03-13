<script lang="ts">
	import { onMount } from 'svelte';
	import SidebarProblemStatus from './SidebarProblemStatus.svelte';
	import type { TeamData } from '../../src/sharedTypes';
	import type {
		WebviewMessageType,
		MessageType,
		SidebarTeamStatus
	} from '../../src/SidebarProvider';
	import type { RepoState } from '../../src/teamRepoManager';

	let teamname: string;
	let password: string;

	let loggedIn = false;

	let teamData: TeamData | null = null;
	let teamStatus: SidebarTeamStatus | null = null;

	let repoState: RepoState | null = null;

	let totalProblems = 0;

	function postMessage(message: MessageType) {
		vscode.postMessage(message);
	}

	function onCloneOpenRepo() {
		if (teamData) {
			postMessage({
				msg: 'onCloneOpenRepo',
				data: { contestId: teamData.contestId, teamId: teamData.teamId }
			});
		}
	}

	function onCloneRepo() {
		if (teamData) {
			postMessage({
				msg: 'onCloneRepo',
				data: { contestId: teamData.contestId, teamId: teamData.teamId }
			});
		}
	}

	function onOpenRepo() {
		if (teamData) {
			postMessage({
				msg: 'onOpenRepo',
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
		loggedIn = false;
		teamData = null;
	}

	function onTestAndSubmit() {
		postMessage({ msg: 'onTestAndSubmit' });
	}

	onMount(() => {
		postMessage({ msg: 'onUIMount' });
	});

	window.addEventListener('message', (event) => {
		const m = (event as MessageEvent).data as WebviewMessageType;
		if (m.msg === 'onLogin') {
			loggedIn = true;
			teamData = m.data;
			teamStatus = null;
		} else if (m.msg === 'onLogout') {
			loggedIn = false;
			teamStatus = null;
		} else if (m.msg === 'teamStatusUpdated') {
			teamStatus = m.data;
			totalProblems = teamStatus
				? teamStatus.correctProblems.length +
					teamStatus.processingProblems.length +
					teamStatus.incorrectProblems.length +
					teamStatus.notStartedProblems.length
				: 0;
		} else if (m.msg === 'repoStateUpdated') {
			repoState = m.data;
		}
	});
</script>

{#if !loggedIn}
	<h1>Contest Login</h1>
	<label for="teamname">Team Name</label>
	<input bind:value={teamname} id="teamname" type="text" />

	<label for="password">Password</label>
	<input bind:value={password} id="password" type="password" />

	<div class="buttonContainer">
		<button on:click={onLogin}>Login</button>
	</div>
{:else}
	<h2 class="sidebarSectionHeader">Contest Info</h2>
	{#if teamData}
		<div class="sidebarSection">
			<p>
				<span class="infoLabel">Team:</span>
				<span class="infoData">{teamData.teamName}</span>
				<span class="extraInfo"> (#{teamData.teamId})</span>
			</p>
			<p>
				<span class="infoLabel">Contest:</span>
				<span class="infoData">{teamData.contestName}</span>
				<span class="extraInfo"> (#{teamData.contestId})</span>
			</p>
			<p>
				<span class="infoLabel">Language:</span>
				<span class="infoData">{teamData.language}</span>
			</p>
			<div class="buttonContainer">
				<button on:click={onLogout} class="sidebarButton">Logout</button>
			</div>
		</div>

		<h2 class="sidebarSectionHeader">Actions</h2>
		<div class="sidebarSection">
			{#if repoState == "No Team"}
				<span>Team not connected, click Refresh at the top of this panel</span>
			{:else if repoState == "No Repo"}
				<div class="buttonContainer">
					<button on:click={onCloneOpenRepo} class="sidebarButton">Clone and Open Repo</button>
				</div>
			{:else if repoState == "Repo Exists, Not Open"}
				<div class="buttonContainer">
					<button on:click={onOpenRepo} class="sidebarButton">Open Repo</button>
				</div>
			{:else if repoState == "Repo Open"}
				<div class="buttonContainer">
					<button on:click={onTestAndSubmit} class="sidebarButton">Test & Submit</button>
					<button on:click={onCloneRepo} class="sidebarButton">Reset Repo</button>
				</div>
			{:else}
				<span>Checking repo state...</span>
			{/if}
		</div>

		<h2 class="sidebarSectionHeader">Problem Progress</h2>
		<div class="sidebarSection">
			{#if teamStatus}
				<div class="problemResultsSection">
					<div>
						<span class="problemResultsSectionHeader inProgress">Pending Judgment </span>
					</div>
					{#if teamStatus.processingProblems.length > 0}
						{#each teamStatus.processingProblems as inProgressProblem (JSON.stringify(inProgressProblem))}
							<SidebarProblemStatus
								problem={inProgressProblem}
								contestState={teamStatus.contestState}
							/>
						{/each}
					{:else}
						<div class="problemSectionExplanation">No pending submissions</div>
					{/if}
				</div>
				<div class="problemResultsSection">
					<div>
						<span class="problemResultsSectionHeader correct">Correct </span>
						<span class="problemResultsSectionCount"
							>{teamStatus.correctProblems.length} of {totalProblems}</span
						>
					</div>
					{#if teamStatus.correctProblems.length > 0}
						{#each teamStatus.correctProblems as correctProblem (JSON.stringify(correctProblem))}
							<SidebarProblemStatus
								problem={correctProblem}
								contestState={teamStatus.contestState}
							/>
						{/each}
					{:else}
						<div class="problemSectionExplanation">Solved problems appear here</div>
					{/if}
				</div>
				<div class="problemResultsSection">
					<div>
						<span class="problemResultsSectionHeader incorrect">Incorrect </span>
						<span class="problemResultsSectionCount"
							>{teamStatus.incorrectProblems.length} of {totalProblems}</span
						>
					</div>
					{#if teamStatus.incorrectProblems.length > 0}
						{#each teamStatus.incorrectProblems as incorrectProblem (JSON.stringify(incorrectProblem))}
							<SidebarProblemStatus
								problem={incorrectProblem}
								contestState={teamStatus.contestState}
							/>
						{/each}
					{:else}
						<div class="problemSectionExplanation">Attempted problems appear here until solved</div>
					{/if}
				</div>
				{#if teamStatus.notStartedProblems.length > 0}
					<div class="problemResultsSection">
						<div>
							<span class="problemResultsSectionHeader notAttempted">Not Attempted </span>
							<span class="problemResultsSectionCount"
								>{teamStatus.notStartedProblems.length} of {totalProblems}</span
							>
						</div>
						{#each teamStatus.notStartedProblems as notStartedProblem (JSON.stringify(notStartedProblem))}
							<SidebarProblemStatus
								problem={notStartedProblem}
								contestState={teamStatus.contestState}
							/>
						{/each}
					</div>
				{/if}
			{:else}
				<span>Fetching data...</span>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.sidebarSectionHeader {
		font-weight: bold;
		border-bottom: 1px solid var(--vscode-charts-yellow);
		color: var(--vscode-charts-yellow);
	}

	.sidebarSection {
		margin-bottom: 12px;
		padding-left: 8px;
		margin-top: 6px;
	}

	.buttonContainer {
		text-align: center;
	}

	.sidebarButton {
		border-radius: 4px;
		width: 80%;
		margin-top: 4px;
	}

	.infoLabel {
		font-weight: bold;
		font-size: 15px;
	}

	.infoData {
		font-weight: bold;
	}

	.extraInfo {
		font-size: smaller;
		visibility: collapse;
	}

	.problemResultsSection {
		padding-bottom: 16px;
	}

	.problemResultsSectionHeader {
		font-size: 16px;
		font-weight: bold;
	}

	.problemSectionExplanation {
		margin-left: 18px;
		font-style: italic;
	}

	.problemResultsSectionHeader.correct {
		color: var(--vscode-charts-green);
	}

	.problemResultsSectionHeader.inProgress {
		color: var(--vscode-editorLightBulb-foreground);
	}

	.problemResultsSectionHeader.incorrect {
		color: var(--vscode-charts-red);
	}

	.problemResultsSectionCount {
		padding-left: 2px;
		font-size: 14px;
	}
</style>
