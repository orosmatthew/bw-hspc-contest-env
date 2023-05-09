<script lang="ts">
    import { onMount } from "svelte";

    function postMessage(message: any) {
        vscode.postMessage(message);
    }

    type ProblemData  = {
        id: number,
        name: string,
        pascalName: string,
        sampleInput: string,
        sampleOutput: string
    }[];

    let savedInputs: Map<number, {input: string, output: string}> = new Map();

    let activeProblem: ProblemData[0];
    let sessionToken: string | undefined;
    let problemData: ProblemData | undefined;

    let sampleInputText: HTMLTextAreaElement;
    let outputText: HTMLTextAreaElement;

    let running = false;

    $: if (problemData && problemData.length !== 0) {
        let first = problemData.at(0);
        if (first) {
            activeProblem = first;
        }
    };

    function resetInput() {
        sampleInputText.value = activeProblem.sampleInput;
    }

    let contestId: number | undefined;
    let teamId: number | undefined;

    function onRun() {
        if (!running && contestId && teamId) {
            postMessage({type: 'onRun', value: {problemPascalName: activeProblem.pascalName, contestId: contestId, teamId: teamId, input: sampleInputText.value}});
            running = true;
        }
    }

    function updateTextBoxes() {
        if (savedInputs.has(activeProblem.id)) {
            sampleInputText.value = savedInputs.get(activeProblem.id)!.input;
            outputText.value = savedInputs.get(activeProblem.id)!.output;
        } else {
            sampleInputText.value = activeProblem.sampleInput;
            outputText.value = "[Run to get output]";
        }
    }

    function onSubmit() {
        if (teamId && contestId && sessionToken) {
            postMessage({type: 'onSubmit', value: {sessionToken: sessionToken, contestId: contestId, teamId: teamId, problemId: activeProblem.id, problemName: activeProblem.pascalName}})
        }
    }

    function onKill() {
        postMessage({type: 'onKill'});
    }

    async function fetchProblemData() {
        if (sessionToken) {
            const res = await fetch(`http://localhost:5173/api/contest/${sessionToken}`);
            const data = await res.json();
            if (data.success === true) {
                problemData = data.problems as ProblemData;
                contestId = data.contestId;
                teamId = data.teamId;
            }  
        }
    }

    window.addEventListener("message", async (event) => {
        const message = (event as MessageEvent).data;
        if (message.type === "onSession") {
            if (message.value !== "") {
                sessionToken = message.value;
                await fetchProblemData();
                updateTextBoxes();
            }
        } else if (message.type === 'onOutput') {
            outputText.value = message.value;
            running = false;
        }
    }) 

    onMount(() => {
        postMessage({type: "onStartup"});
    })

</script>

<h1>Test & Submit Problems</h1>

{#if problemData}
    <div class="tab-container">
        {#each problemData as problem}
        <button on:click={() => {
            if (!running) {
                savedInputs.set(activeProblem.id, {input: sampleInputText.value, output: outputText.value});
                activeProblem = problem;
                updateTextBoxes();
            }
        }} id={`problem_${problem.id}`} type="button" class={"tab " + (activeProblem.id == problem.id ? "active" : "")}>{problem.name}</button>
        {/each}
    </div>
{/if}

{#if activeProblem}
    <h2>{activeProblem.name}</h2>
    <div style="display:flex">
        <div style="flex:1; margin-right:20px">
            <h3>Sample Input (You can edit this!)</h3>
            <textarea bind:this={sampleInputText} />
            <button style="margin-top:5px" on:click={resetInput} type="button">Reset Input</button>
        </div>
        <div style="flex:1">
            <div style="display:flex">
                <h3 style="margin-right:5px">Output</h3>
                {#if running}
                    <span class="loader"></span>
                {/if}
            </div>
            <textarea bind:this={outputText} disabled />
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
        border: 3px solid #FFF;
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