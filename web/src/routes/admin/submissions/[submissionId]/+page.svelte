<script lang="ts">
	import type { Actions, PageData } from './$types';
	import { enhance } from '$app/forms';
	import {
		minutesFromContestStart,
		stretchTextarea,
		submissionTimestampHoverText
	} from '$lib/util';
	import ConfirmModal from '$lib/ConfirmModal.svelte';
	import SubmissionCodeAndOutput from '$lib/SubmissionCodeAndOutput.svelte';
	import { goto } from '$app/navigation';
	import TestCaseResults from '$lib/TestCaseResults.svelte';
	import { theme } from '../../../../routes/stores';

	export let data: PageData;
	export let form: Actions;

	let confirmModal: ConfirmModal;
	let gradingMessage: HTMLTextAreaElement;

	$: if (form && form.success) {
		goto('/admin/reviews');
	}

	let correct: boolean | null = null;

	function incorrectClicked() {
		correct = correct != false ? false : null;
	}

	function correctClicked() {
		correct = correct != true ? true : null;
	}

	function enhanceConfirmGrading(form: HTMLFormElement) {
		enhance(form, async ({ cancel }) => {
			const confirmText =
				correct === true
					? `Grading as CORRECT. Are you sure?`
					: gradingMessage.value.trim().length == 0
						? `Grading as INCORRECT with NO MESSAGE! Are you sure?`
						: `Grading as INCORRECT with message '${gradingMessage.value}'. Are you sure?`;

			if ((await confirmModal.prompt(confirmText)) !== true) {
				cancel();
			}
			return async ({ update }) => {
				await update();
			};
		});
	}
</script>

<svelte:head>
	<title>Submission: {data.teamName} - {data.problemName}</title>
</svelte:head>

<ConfirmModal bind:this={confirmModal} />

<h3 style="text-align:center" class="mb-1">
	<i class="bi bi-envelope-paper"></i> Submission History
</h3>
<h4 style="text-align:center" class="mb-4">
	Team: <span style="font-family: monospace">{data.teamName}</span> | Problem:
	<span style="font-family: monospace">{data.problemName}</span>
</h4>

{#if form && !form.success}
	<div class="alert alert-danger">Error: {form.error}</div>
{/if}

<div class="row">
	<div class="col-4">
		<a href="/admin/submissions" class="mb-3 btn btn-outline-primary">All Submissions</a>
	</div>
	<div class="col-8 text-end">
		<div>
			<form
				method="POST"
				action="?/clearJudgment"
				style="display: inline-block"
				use:enhance={async ({ cancel }) => {
					if (
						(await confirmModal.prompt(
							'Are you SURE you want move this to "In Review"? The team will see this state change. This will NOT rerun the autoJudge.'
						)) !== true
					) {
						cancel();
					}
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<button type="submit" class="btn btn-warning m-1">Clear Judgment</button>
			</form>
			<form
				method="POST"
				action="?/rerun"
				style="display: inline-block"
				use:enhance={async ({ cancel }) => {
					if (
						(await confirmModal.prompt(
							'Are you SURE you want to reset to "Queued" and rerun team code on the sandbox? The team will see this state change.'
						)) !== true
					) {
						cancel();
					}
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<button
					type="submit"
					class="btn btn-warning m-1"
					disabled={data.submission.commitHash.trim().length == 0}>Rerun Submission</button
				>
			</form>
			<form
				method="POST"
				action="?/delete"
				style="display: inline-block"
				use:enhance={async ({ cancel }) => {
					if (
						(await confirmModal.prompt(
							'Are you SURE you want to delete the selected submission?'
						)) !== true
					) {
						cancel();
					}
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<button type="submit" class="btn btn-danger m-1"
					>Delete Attempt #{data.submissionHistory.map((s) => s.id).indexOf(data.submission.id) +
						1}</button
				>
			</form>
		</div>
	</div>
</div>

<div class="table-responsive">
	<table class="table table-bordered table-hover" data-bs-theme={$theme}>
		<thead>
			<tr>
				<th></th>
				<th>Status</th>
				<th>Test Case Summary</th>
				<th>Runtime</th>
				<th>Submitted</th>
				<th>Grading</th>
				<th>Message</th>
			</tr>
		</thead>
		<tbody>
			{#each data.submissionHistory as submission, i}
				<tr
					on:click={() => goto(`/admin/submissions/${submission.id.toString()}`)}
					class="{submission.id == data.id
						? 'specifiedSubmission'
						: 'otherSubmission'} {submission.state === 'InReview' ? 'inReview' : ''}"
				>
					<td><span>#{i + 1}</span></td>
					<td>
						{#if submission.state === 'Queued'}
							<span class="badge bg-secondary">Queued</span>
						{:else if submission.state === 'InReview'}
							<span class="badge bg-warning">In Review</span>
						{:else if submission.state === 'Correct'}
							<span class="badge bg-success">Correct</span>
						{:else if submission.state === 'Incorrect'}
							<span class="badge bg-danger">Incorrect</span>
						{/if}

						{#if submission.stateReason === 'BuildError'}
							<span class="badge bg-danger opacity-50">Build Error</span>
						{:else if submission.stateReason === 'TimeLimitExceeded'}
							<span class="badge bg-danger opacity-50">Time Limit Exceeded</span>
						{:else if submission.stateReason === 'IncorrectOverriddenAsCorrect'}
							<span class="badge bg-success opacity-50">Manually Graded</span>
						{/if}
					</td>
					<td>
						<TestCaseResults
							{submission}
							problem={data.submission.problem}
							previousSubmission={i > 0 ? data.submissionHistory[i - 1] : null}
						/>
					</td>
					<td>
						{submission.runtimeMilliseconds ? `${submission.runtimeMilliseconds} ms` : ''}
					</td>
					<td>
						<span title={submissionTimestampHoverText(data.contest, submission)}>
							{Math.ceil(minutesFromContestStart(data.contest, submission.createdAt))} min
						</span>
					</td>
					<td>
						{#if submission.gradedAt}
							+{Math.ceil(minutesFromContestStart(data.contest, submission.gradedAt)) -
								Math.ceil(minutesFromContestStart(data.contest, submission.createdAt))} min
						{/if}
					</td>
					<td
						>{#if submission.message}
							{submission.message}
						{:else}
							<i>{'<no message>'}</i>
						{/if}
					</td></tr
				>
			{/each}
		</tbody>
	</table>
</div>

{#if data.state == 'InReview'}
	<div
		class="gradingArea mb-3 col-md-auto {correct == null
			? ''
			: correct
				? 'pendingCorrect'
				: 'pendingIncorrect'}"
		data-bs-theme={$theme}
	>
		<h3>
			Grade Attempt #{data.submissionHistory.map((s) => s.id).indexOf(data.submission.id) + 1}
		</h3>
		<form method="POST" action="?/submitGrade" use:enhanceConfirmGrading>
			<h5>Message</h5>
			<textarea bind:this={gradingMessage} name="message" class="mb-3 form-control" />

			<div class="row justify-content-end">
				<div class="text-end">
					<input name="correct" type="hidden" value={correct} />
					<div class="btn-group" role="group">
						<input
							on:click={incorrectClicked}
							type="radio"
							class="btn-check"
							name="btnradio"
							id="btn_incorrect"
							autocomplete="off"
							checked={correct === false}
						/>
						<label class="btn btn-outline-danger" for="btn_incorrect">Incorrect</label>
						<input
							on:click={correctClicked}
							type="radio"
							class="btn-check"
							name="btnradio"
							id="btn_correct"
							autocomplete="off"
							checked={correct === true}
						/>
						<label class="btn btn-outline-success" for="btn_correct">Correct</label>
					</div>
					<button id="submit_btn" type="submit" class="btn btn-primary" disabled={correct === null}
						>Submit</button
					>
				</div>
			</div>
		</form>
	</div>
{/if}

{#if data.state == 'Incorrect' && (data.stateReason == 'BuildError' || data.stateReason == 'TimeLimitExceeded' || data.stateReason == 'SandboxError')}
	<h3 style="text-align:center">{data.stateReason}</h3>
	<textarea use:stretchTextarea class="code mb-3 form-control" disabled
		>{data.stateReasonDetails}</textarea
	>
{/if}

<hr />
<h3 class="mt-3 mb-3">
	Attempt #{data.submissionHistory.map((s) => s.id).indexOf(data.submission.id) + 1} Details
</h3>

{#key data.id}
	<SubmissionCodeAndOutput
		problem={data.submission.problem}
		output={data.output}
		expectedOutput={data.expectedOutput}
		diff={data.diff}
		sourceFiles={data.sourceFiles}
	/>
{/key}

<style>
	:root {
		--specifiedSubmission-border-color: #0012c5;
		--specifiedSubmission-background-color: #e5ebff;

		--specifiedSubmissionInReview-border-color: orange;
		--specifiedSubmissionInReview-background-color: #fff7e6;

		--specifiedSubmissionInReviewPendingCorrect-background-color: #f1fff3;
		--specifiedSubmissionInReviewPendingCorrect-border-color: green;

		--specifiedSubmissionInReviewPendingIncorrect-background-color: #ffefef;
		--specifiedSubmissionInReviewPendingIncorrect-border-color: red;
	}

	[data-bs-theme='dark'] {
		--specifiedSubmission-border-color: #3e3eb9;
		--specifiedSubmission-background-color: #050531;

		--specifiedSubmissionInReview-border-color: #e1a800;
		--specifiedSubmissionInReview-background-color: #292200;

		--specifiedSubmissionInReviewPendingCorrect-background-color: #001a04;
		--specifiedSubmissionInReviewPendingCorrect-border-color: #00a200;

		--specifiedSubmissionInReviewPendingIncorrect-background-color: #270000;
		--specifiedSubmissionInReviewPendingIncorrect-border-color: #a90000;
	}

	tr.specifiedSubmission {
		border: 3px solid var(--specifiedSubmission-border-color);
	}

	tr.specifiedSubmission.inReview {
		border: 3px solid var(--specifiedSubmissionInReview-border-color);
	}

	tr.specifiedSubmission td {
		background-color: var(--specifiedSubmission-background-color);
	}

	tr.specifiedSubmission.inReview td {
		background-color: var(--specifiedSubmissionInReview-background-color);
	}

	tr.otherSubmission {
		opacity: 0.65;
		cursor: pointer;
	}

	.gradingArea {
		border: 3px solid var(--specifiedSubmissionInReview-border-color);
		padding: 4px 10px 10px 10px;
		margin-left: 100px;
		margin-right: 100px;
		background-color: var(--specifiedSubmissionInReview-background-color);
	}

	.gradingArea.pendingCorrect {
		background-color: var(--specifiedSubmissionInReviewPendingCorrect-background-color);
		border-color: var(--specifiedSubmissionInReviewPendingCorrect-border-color);
	}

	.gradingArea.pendingIncorrect {
		background-color: var(--specifiedSubmissionInReviewPendingIncorrect-background-color);
		border-color: var(--specifiedSubmissionInReviewPendingIncorrect-border-color);
	}
</style>
