<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebviewMessageType, MessageType, ProblemData } from '../../src/problemPanel';

	function postMessage(message: MessageType) {
		vscode.postMessage(message);
	}

	// let savedInputs: Map<number, { input: string; output: string }> = new Map();

	let activeProblemIndex = 0;
	let problemData: ProblemData | undefined;

	let sampleInputValue: string;
	let outputValue: string;

	let running = false;

	$: if (problemData && problemData.length !== 0) {
		activeProblemIndex = 0;
	}

	function resetInput() {
		if (problemData) {
			sampleInputValue = problemData[activeProblemIndex].sampleInput;
		} else {
			sampleInputValue = '';
		}
	}

	function onRun() {
		if (problemData !== undefined) {
			postMessage({
				msg: 'onRun',
				data: { input: sampleInputValue, problemId: problemData[activeProblemIndex].id }
			});
		}
	}

	function updateTextBoxes() {
		// if (savedInputs.has(activeProblem.id)) {
		// 	sampleInputText.value = savedInputs.get(activeProblem.id)!.input;
		// 	outputText.value = savedInputs.get(activeProblem.id)!.output;
		// } else {
		if (problemData !== undefined) {
			sampleInputValue = problemData[activeProblemIndex].sampleInput;
		}
		outputValue = '[Run to get output]';
		// }
	}

	function onSubmit() {
		// if (teamId && contestId && sessionToken) {
		// 	postMessage({
		// 		type: 'onSubmit',
		// 		value: {
		// 			sessionToken: sessionToken,
		// 			contestId: contestId,
		// 			teamId: teamId,
		// 			problemId: activeProblem.id,
		// 			problemName: activeProblem.pascalName
		// 		}
		// 	});
		// }
	}

	function onKill() {
		postMessage({ msg: 'onKill' });
	}

	onMount(() => {
		postMessage({ msg: 'onRequestProblemData' });
	});

	window.addEventListener('message', async (event) => {
		const m = (event as MessageEvent).data as WebviewMessageType;
		if (m.msg === 'onProblemData') {
			problemData = m.data;
			updateTextBoxes();
		} else if (m.msg === 'onRunning') {
			running = true;
		} else if (m.msg === 'onRunningDone') {
			running = false;
		} else if (m.msg === 'onRunningOutput') {
			outputValue = m.data;
		}
	});
</script>

<h1>Test & Submit Problems</h1>

{#if problemData}
	<div class="tab-container">
		{#each problemData as problem, i}
			<button
				on:click={() => {
					if (!running) {
						// savedInputs.set(activeProblem.id, {
						// 	input: sampleInputText.value,
						// 	output: outputText.value
						// });
						activeProblemIndex = i;
						updateTextBoxes();
					}
				}}
				id={`problem_${problem.id}`}
				type="button"
				class={'tab ' + (activeProblemIndex === i ? 'active' : '')}>{problem.name}</button
			>
		{/each}
	</div>
{/if}

{#if problemData !== undefined}
	<h2>{problemData[activeProblemIndex].name}</h2>
	<div style="display:flex">
		<div style="flex:1; margin-right:20px">
			<h3>Sample Input (You can edit this!)</h3>
			<textarea bind:value={sampleInputValue} />
			<button style="margin-top:5px" on:click={resetInput} type="button">Reset Input</button>
		</div>
		<div style="flex:1">
			<div style="display:flex">
				<h3 style="margin-right:5px">Output</h3>
				{#if running}
					<span class="loader"></span>
				{/if}
			</div>
			<textarea bind:value={outputValue} readonly />
			{#if !running}
				<button style="margin-top:5px" on:click={onRun} type="button">Run</button>
			{:else}
				<button style="margin-top:5px" on:click={onKill} type="button">Stop</button>
			{/if}
		</div>
	</div>
	<button on:click={onSubmit} type="button">Submit</button>
{/if}

<style>
	textarea {
		resize: vertical;
		height: 250px;
	}

	.tab-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		height: 30px;
		margin-bottom: 10px;
	}

	.tab {
		flex: 1;
		border: none;
		cursor: pointer;
		text-align: center;
	}

	.tab.active {
		background-color: rgb(95, 103, 118);
	}

	.loader {
		width: 16px;
		height: 16px;
		border: 3px solid #fff;
		border-bottom-color: transparent;
		border-radius: 50%;
		display: inline-block;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
