<script lang="ts" module>
	import type { VSCode } from '../vscode';
	declare const vscode: VSCode;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { WebviewMessageType, MessageType, ProblemData } from '../../src/problemPanel';

	function postMessage(message: MessageType) {
		vscode.postMessage(message);
	}

	// let savedInputs: Map<number, { input: string; output: string }> = new Map();

	let activeProblemIndex = $state(0);
	let problemData: ProblemData | undefined = $state();

	let sampleInputValue: string = $state('');
	let outputValue: string = $state('');

	let running = $state(false);

	$effect(() => {
		if (problemData && problemData.length !== 0) {
			activeProblemIndex = 0;
		}
	});

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
		if (problemData !== undefined) {
			postMessage({ msg: 'onSubmit', data: { problemId: problemData[activeProblemIndex].id } });
		}
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
				onclick={() => {
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
				class={'tab ' + (activeProblemIndex === i ? 'active' : 'inactive')}>{problem.name}</button
			>
		{/each}
	</div>
{/if}

{#if problemData !== undefined}
	<h2>{problemData[activeProblemIndex].name}</h2>
	<div style="display:flex">
		<div style="flex:1; margin-right:20px">
			<h3>Sample Input (You can edit this!)</h3>
			<textarea class="inputOutputArea" bind:value={sampleInputValue}></textarea>
			<button style="margin-top:5px" onclick={resetInput} type="button">Reset Input</button>
		</div>
		<div style="flex:1">
			<div style="display:flex">
				<h3 style="margin-right:5px">Output</h3>
				{#if running}
					<span class="loader"></span>
				{/if}
			</div>
			<textarea class="inputOutputArea" bind:value={outputValue} readonly></textarea>
			{#if !running}
				<button style="margin-top:5px" onclick={onRun} type="button">Run</button>
			{:else}
				<button style="margin-top:5px" onclick={onKill} type="button">Stop</button>
			{/if}
		</div>
	</div>
	<button onclick={onSubmit} type="button">Submit</button>
{/if}

<style>
	textarea {
		resize: vertical;
		height: 250px;
	}

	.tab-container {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.tab {
		flex: 1;
		border: none;
		cursor: pointer;
		text-align: center;
		margin-left: 2px;
		margin-right: 2px;
		border: 1px solid var(--vscode-checkbox-border);
	}

	.tab.active {
		border: 1px solid var(--vscode-checkbox-selectBorder);
	}

	.tab.inactive {
		color: var(--vscode-tab-inactiveForeground);
		background-color: var(--vscode-tab-inactiveBackground);
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

	.inputOutputArea {
		font-family: monospace;
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
