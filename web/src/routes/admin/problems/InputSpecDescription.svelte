<script lang="ts">
	import Modal from '$lib/Modal.svelte';

	interface Props {
		inputSpecModal: Modal;
	}

	let { inputSpecModal }: Props = $props();
</script>

<div class="modal-body">
	<p>
		<i><b>Optional</b></i> description the structure of a single input case for a specific problem as
		a semicolon-separated list of instructions to consume lines. (Only used for showing seprated input
		cases alongside team outputs.)
	</p>
	<div>
		These instructions take 2 forms:
		<ul>
			<li>"<b>C</b><i>n</i>" = Consume exactly <i>n</i> lines.</li>
			<ul>
				<li><b>C3</b> consumes 3 lines.</li>
			</ul>
			<li>
				"<b>T</b><i>n</i>" = Read the <i>n</i><sup>th</sup> Token on the current line, parse it as a
				number, then consume the current line plus <i>n</i> additional lines.
			</li>
			<ul>
				<li>
					If the first line of an input case is a "5" indicating 5 lines will follow, then <b>T0</b>
					will consume the line with the "5" <i>and</i> the 5 lines afterward.
				</li>
				<li>
					<b>T1</b> is used when an input line like "Name 7" means to consume the following 7 lines.
				</li>
			</ul>
		</ul>
	</div>
	<div>
		The parsing starts from the first line of an input case, with each instruction adjusting the
		'current line'. Some problems will require multiple instructions to parse a case.
		<ul>
			<li>
				<b>T0;C2</b> means the first line of the case indicates a number of lines to follow, and then
				after that there's exactly 2 more lines.
			</li>
			<li>
				<b>C2;T0</b> means the case always begins with 2 lines, <i>then</i> a line with a number indicating
				how many lines will follow that.
			</li>
		</ul>
	</div>
</div>
<div class="modal-footer">
	<button
		onclick={() => {
			inputSpecModal.hide();
		}}
		type="button"
		class="btn btn-secondary">Close</button
	>
</div>
