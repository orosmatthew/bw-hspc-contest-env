<script lang="ts">
    import { onMount } from "svelte";

    function postMessage(message: any) {
        vscode.postMessage(message);
    }

    type ProblemData  = {
        id: number,
        name: string,
        sampleInput: string,
        sampleOutput: string
    }[];

    let activeProblem: ProblemData[0];
    let sessionToken: string | undefined;
    let problemData: ProblemData | undefined;

    let sampleInputText: HTMLTextAreaElement;

    $: if (problemData && problemData.length !== 0) {
        let first = problemData.at(0);
        if (first) {
            activeProblem = first;
        }
    };

    function resetInput() {
        sampleInputText.value = activeProblem.sampleInput;
    }

    async function fetchProblemData() {
        if (sessionToken) {
            const res = await fetch(`http://localhost:5173/api/contest/${sessionToken}`);
            const data = await res.json();
            if (data.success === true) {
                problemData = data.problems as ProblemData;
            }  
        }
    }

    window.addEventListener("message", async (event) => {
        const message = (event as MessageEvent).data;
        if (message.type === "onSession") {
            if (message.value !== "") {
                sessionToken = message.value;
                await fetchProblemData();
            }
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
            activeProblem = problem;
        }} id={`problem_${problem.id}`} type="button" class={"tab " + (activeProblem.id == problem.id ? "active" : "")}>{problem.name}</button>
        {/each}
    </div>
{/if}

{#if activeProblem}
    <h2>{activeProblem.name}</h2>
    <div style="display:flex">
        <div style="flex:1; margin-right:20px">
            <h3>Sample Input (You can edit this!)</h3>
            <textarea bind:this={sampleInputText}>{activeProblem.sampleInput}</textarea>
            <button style="margin-top:5px" on:click={resetInput} type="button">Reset Input</button>
        </div>
        <div style="flex:1">
            <h3>Output</h3>
            <textarea disabled>{activeProblem.sampleOutput}</textarea>
        </div>
    </div>
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
</style>