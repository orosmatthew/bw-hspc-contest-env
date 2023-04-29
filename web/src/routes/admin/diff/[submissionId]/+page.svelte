<script lang="ts">
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import 'diff2html/bundles/css/diff2html.min.css';
	import { onMount } from 'svelte';
	import type { DiffPostData } from './+server';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	export let data: PageData;

	let incorrectBtn: HTMLInputElement;
	let correctBtn: HTMLInputElement;
	let submitBtn: HTMLButtonElement;
	let messageText: HTMLTextAreaElement;

	onMount(() => {
		const diff2htmlUi = new Diff2HtmlUI(document.getElementById('diff')!, data.diff, {
			drawFileList: false,
			matching: 'lines',
			diffStyle: 'char',
			outputFormat: 'side-by-side',
			highlight: false,
			fileContentToggle: false
		});
		diff2htmlUi.draw();

		incorrectBtn.addEventListener('change', () => {
			submitBtn.disabled = false;
		});
		correctBtn.addEventListener('change', () => {
			submitBtn.disabled = false;
		});
	});

	async function onSubmitClick() {
		if (incorrectBtn.checked) {
			let postData: DiffPostData = {
				correct: false,
				message: messageText.value
			};
			await fetch($page.url, { method: 'POST', body: JSON.stringify(postData) });
			goto('/admin/reviews');
		} else if (correctBtn.checked) {
			let postData: DiffPostData = {
				correct: true,
				message: messageText.value
			};
			await fetch($page.url, { method: 'POST', body: JSON.stringify(postData) });
			goto('/admin/reviews');
		}
	}
</script>

<svelte:head>
	<title>Diff</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Diff</h1>

<a href="/admin/reviews" class="btn btn-outline-primary">Back</a>
<div class="mt-3" id="diff" />

<h5>Message</h5>
<textarea bind:this={messageText} class="mb-3 form-control" />

<div class="row justify-content-end">
	<div class="text-end">
		<div class="btn-group" role="group">
			<input
				bind:this={incorrectBtn}
				type="radio"
				class="btn-check"
				name="btnradio"
				id="btn_incorrect"
				autocomplete="off"
			/>
			<label class="btn btn-outline-danger" for="btn_incorrect">Incorrect</label>
			<input
				bind:this={correctBtn}
				type="radio"
				class="btn-check"
				name="btnradio"
				id="btn_correct"
				autocomplete="off"
			/>
			<label class="btn btn-outline-success" for="btn_correct">Correct</label>
		</div>
		<button
			bind:this={submitBtn}
			on:click={onSubmitClick}
			id="submit_btn"
			type="button"
			class="btn btn-primary"
			disabled>Submit</button
		>
	</div>
</div>
