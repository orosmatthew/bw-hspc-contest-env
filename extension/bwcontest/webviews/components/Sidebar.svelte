<script lang="ts">
function postMessage(message: any) {
    vscode.postMessage(message);
}

let teamname: HTMLInputElement;
let password: HTMLInputElement;

let sessionToken: string | undefined;

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
    } catch (err) {
        console.error('Failed to fetch:', err);
    }
}

async function onLogout() {
    const res = await fetch("http://localhost:5173/api/team/logout", {method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        token: sessionToken,
    })})
    if (res.status !== 200) {
        postMessage({type: 'onError', value: 'Error logging out'});
        return;
    }
    const data = await res.json();
    if (data.success === true) {
        postMessage({type: 'onInfo', value: 'BWContest: Logged out'});
        sessionToken = undefined;
    } else {
        postMessage({type: 'onError', value: 'Log out unsuccessful'});
    }
}
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
{/if}