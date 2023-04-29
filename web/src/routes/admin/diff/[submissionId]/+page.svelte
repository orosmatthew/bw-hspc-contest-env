<script lang="ts">
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import 'diff2html/bundles/css/diff2html.min.css';
	import { onMount } from 'svelte';
	import type { Actions, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	export let data: PageData;
	export let form: Actions;

	$: if (form && form.success) {
		goto('/admin/reviews');
	}

	let incorrectBtn: HTMLInputElement;
	let correctBtn: HTMLInputElement;
	let submitBtn: HTMLButtonElement;

	let correct = false;

	function updateCorrect() {
		if (correctBtn.checked) {
			correct = true;
		} else {
			correct = false;
		}
	}

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
			updateCorrect();
		});
		correctBtn.addEventListener('change', () => {
			submitBtn.disabled = false;
			updateCorrect();
		});
	});
</script>

<svelte:head>
	<title>Diff</title>
</svelte:head>

<h1 style="text-align:center" class="mb-4">Diff</h1>

{#if form && !form.success}
	<div class="alert alert-danger">Submission was not successful</div>
{:else if form && form.success}
	<div class="alert alert-success">Success!</div>
{/if}

<a href="/admin/reviews" class="btn btn-outline-primary">Back</a>
<div class="mt-3" id="diff" />

<form method="POST" action="?/submit" use:enhance>
	<h5>Message</h5>
	<textarea class="mb-3 form-control" />

	<div class="row justify-content-end">
		<div class="text-end">
			<input name="correct" type="hidden" value={correct} />
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
			<button bind:this={submitBtn} id="submit_btn" type="submit" class="btn btn-primary" disabled
				>Submit</button
			>
		</div>
	</div>
</form>
