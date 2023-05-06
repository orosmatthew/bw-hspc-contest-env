<script lang="ts">
  import { onMount } from "svelte";

    function postMessage(message: any) {
        vscode.postMessage(message);
    }

    let teamname: HTMLInputElement;
    let password: HTMLInputElement;

    let sessionToken: string | undefined;

    interface TeamData {
        teamId: number,
        contestId: number
    }
    
    let teamData: TeamData | undefined;

    async function fetchTeamData() {
        if (sessionToken) {
            const res = await fetch(`http://localhost:5173/api/team/${sessionToken}`, {method: "GET"});
            const data = await res.json();
            if (!data.success) {
                postMessage({type: 'onError', value: "BWContest: Failed to fetch team data"});
                return;
            }
            teamData = data.data as TeamData;
        }
    }

    async function onClone() {
        if (teamData) {
            postMessage({type: 'onClone', value: {contestId: teamData.contestId, teamId: teamData.teamId}});
        }
    }

    async function onLogin() {
        try {
            const res = await fetch("http://localhost:5173/api/team/login", {method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                teamname: teamname.value, password: password.value
            })});
            if (res.status !== 200) {
                postMessage({type: 'onError', value: 'Error logging in'});
                return;
            }
            const data = await res.json();
            if (data.success === false) {
                postMessage({type: 'onError', value: data.message ?? "Unknown error logging in"});
                return;
            }
            sessionToken = data.token;
            postMessage({type: 'onLogin', value: sessionToken});
        } catch (err) {
            console.error('Failed to fetch:', err);
        }
        fetchTeamData();
    }

    async function onLogout() {
        const res = await fetch("http://localhost:5173/api/team/logout", {method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            token: sessionToken,
        })})
        if (res.status !== 200) {
            postMessage({type: 'onError', value: 'Error logging out'});
            sessionToken = undefined;
            return;
        }
        const data = await res.json();
        if (data.success === true) {
            postMessage({type: 'onInfo', value: 'BWContest: Logged out'});
            sessionToken = undefined;
            postMessage({type: 'onLogout'});
        } else {
            postMessage({type: 'onError', value: 'Log out unsuccessful'});
        }
    }

    window.addEventListener("message", event => {
        const message = (event as MessageEvent).data;
        if (message.type === "onSession") {
            if (message.value !== "") {
                sessionToken = message.value;
                fetchTeamData();
            }
        }
    }) 

    onMount(() => {
        postMessage({type: "onStartup"});
    })
</script>

<h1>Contest</h1>

{#if sessionToken === undefined}
    <label for="teamname">Team Name</label>
    <input bind:this={teamname} id="teamname" type="text"/>

    <label for="password">Password</label>
    <input bind:this={password} id="password" type="password"/>

    <button on:click={onLogin}>Login</button>
{:else}
    <button on:click={onLogout}>Logout</button>
    {#if teamData}
        <p>TeamID: {teamData.teamId}</p>
        <p>ContestID: {teamData.contestId}</p>
        <button on:click={onClone}>Clone and Open Repo</button>
    {/if}
{/if}