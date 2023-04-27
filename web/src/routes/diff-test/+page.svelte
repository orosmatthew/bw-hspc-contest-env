<script lang="ts">
	import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-base';
	import 'diff2html/bundles/css/diff2html.min.css';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

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

		let incorrectBtn = document.getElementById('btn_incorrect')! as HTMLInputElement;
		let correctBtn = document.getElementById('btn_correct')! as HTMLInputElement;
		let submitBtn = document.getElementById('submit_btn')! as HTMLButtonElement;

		incorrectBtn?.addEventListener('change', () => {
			submitBtn.disabled = false;
		});
		correctBtn?.addEventListener('change', () => {
			submitBtn.disabled = false;
		});
	});
</script>

<svelte:head>
	<title>Diff Test</title>
</svelte:head>

<h1 class="mb-4">Diff Test</h1>

<a href="/reviews" class="btn btn-outline-primary">Back</a>
<div class="mt-3" id="diff" />

<div class="row justify-content-end">
	<div class="text-end">
		<div class="btn-group" role="group">
			<input type="radio" class="btn-check" name="btnradio" id="btn_incorrect" autocomplete="off" />
			<label class="btn btn-outline-danger" for="btn_incorrect">Incorrect</label>
			<input type="radio" class="btn-check" name="btnradio" id="btn_correct" autocomplete="off" />
			<label class="btn btn-outline-success" for="btn_correct">Correct</label>
		</div>
		<button id="submit_btn" type="button" class="btn btn-primary" disabled>Submit</button>
	</div>
</div>
