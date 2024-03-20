<script lang="ts" context="module">
	export const watSubmissionsImageUrl = new URL(
		'../../media/SubmissionIcons/TeamPanel/none.png',
		import.meta.url
	).href;

	export const correctSubmissionImageUrl = new URL(
		'../../media/SubmissionIcons/TeamPanel/correct.png',
		import.meta.url
	).href;

	export const incorrectSubmissionImageUrl = new URL(
		'../../media/SubmissionIcons/TeamPanel/incorrect.png',
		import.meta.url
	).href;

	export const pendingSubmissionImageUrl = new URL(
		'../../media/SubmissionIcons/TeamPanel/unknown.png',
		import.meta.url
	).href;

	export const noSubmissionsImageUrl = new URL(
		'../../media/SubmissionIcons/TeamPanel/none.png',
		import.meta.url
	).href;
</script>

<script lang="ts">
	import type { SidebarProblemWithSubmissions } from '../../src/SidebarProvider';
	import type {
		ContestStateForExtension,
		SubmissionForExtension,
		SubmissionStateForExtension
	} from 'bwcontest-shared/types/contestMonitorTypes';

	export let contestState: ContestStateForExtension;
	export let problem: SidebarProblemWithSubmissions;

	const sortedSubmissions = problem.submissions
		? problem.submissions.sort(
				(s1, s2) => Date.parse(s1.createdAt.toString()) - Date.parse(s2.createdAt.toString())
			)
		: [];

	const highlightClasses = `${problem.modified ? 'highlight' : ''} ${problem.overallState?.toLowerCase()}`;

	function getStatusImageUrl(overallState: SubmissionStateForExtension | null): string {
		switch (overallState) {
			case 'Correct':
				return correctSubmissionImageUrl;
			case 'Incorrect':
				return incorrectSubmissionImageUrl;
			case 'Processing':
				return pendingSubmissionImageUrl;
			default:
				return watSubmissionsImageUrl;
		}
	}

	function getContestOffsetDisplay(submission: SubmissionForExtension): string {
		if (!contestState.startTime) {
			return '?';
		}

		try {
			const contestStartAbsoluteMillis = Date.parse(contestState.startTime.toString());
			const submissionTimeAbsoluteMillis = Date.parse(submission.createdAt.toString());
			const submissionRelativeMillis = submissionTimeAbsoluteMillis - contestStartAbsoluteMillis;
			const minutesFromContestStart = Math.ceil(submissionRelativeMillis / 1000 / 60);
			return `${minutesFromContestStart} min`;
		} catch (error) {
			return '???';
		}
	}

	function pluralize(num: number, singular: string, plural: string) {
		return num === 1 ? singular : plural;
	}
</script>

<div class={'problemStatusDiv ' + highlightClasses}>
	<div class={'problemHeaderDiv'}>
		<img
			class="overallStatusImage"
			src={getStatusImageUrl(problem.overallState)}
			alt={problem.overallState}
		/>
		<div class="problemHeader">
			{#if problem.submissions.length == 0}
				<span class="problemHeaderName">{problem.problem.friendlyName}</span>
			{:else}
				<span class="problemHeaderName">{problem.problem.friendlyName}</span>
				<span class="problemHeaderSubmitCount">
					{problem.submissions.length}
					{pluralize(problem.submissions.length, 'attempt', 'attempts')}</span
				>
				{#if problem.submissions.filter((s) => s.state === 'Processing').length > 0}
					<span
						>({problem.submissions.filter((s) => s.state === 'Processing').length} pending...)</span
					>
				{/if}
				{#if problem.overallState === 'Correct'}
					<span class="individualSubmissionAttemptTime">
						@ {getContestOffsetDisplay(
							problem.submissions.filter((s) => s.state === 'Correct')[0]
						)}</span
					>
				{/if}
			{/if}
		</div>
	</div>
	{#if problem.overallState !== 'Correct'}
		{#each sortedSubmissions as submission, i}
			<div class="individualSubmissionDiv">
				<span class="individualSubmissionAttemptNumber">Submit #{i + 1}: </span>
				<img
					class="individualSubmissionStatusImage"
					src={getStatusImageUrl(submission.state)}
					alt={submission.state}
				/>
				<span class="individualSubmissionResult {submission.state.toLowerCase()}">
					{submission.state}
				</span>
				<span class="individualSubmissionAttemptTime">
					@ {getContestOffsetDisplay(submission)}</span
				>
			</div>
			{#if submission.message}
				<div class="individualSubmissionMessageWrapper">
					Judge: <span class="individualSubmissionMessage">{submission.message}</span>
				</div>
			{/if}
		{/each}
	{/if}
</div>

<style>
	.problemStatusDiv {
		padding-top: 8px;
		padding-left: 16px;
		padding-bottom: 6px;
	}

	.problemHeaderDiv {
		display: flex;
		align-items: center;
	}

	.problemHeaderName {
		font-size: 15px;
		font-weight: bold;
	}

	.problemHeaderSubmitCount {
		margin-left: 4px;
		font-style: italic;
	}

	.problemHeader {
		margin-left: 6px;
	}

	.overallStatusImage {
		height: 18px;
		width: 18px;
	}

	.individualSubmissionStatusImage {
		height: 12px;
		width: 12px;
		margin-left: 6px;
	}

	.individualSubmissionDiv {
		margin-left: 38px;
		display: flex;
		align-items: center;
		padding-top: 4px;
	}

	.individualSubmissionAttemptNumber {
		font-weight: bold;
		margin-left: 6px;
	}

	.individualSubmissionAttemptTime {
		margin-left: 4px;
		color: var(--vscode-descriptionForeground);
	}

	.individualSubmissionResult {
		padding-left: 4px;
	}

	.individualSubmissionResult.processing {
		color: var(--vscode-charts-yellow);
	}

	.individualSubmissionResult.correct {
		color: var(--vscode-charts-green);
	}

	.individualSubmissionResult.incorrect {
		color: var(--vscode-charts-red);
	}

	.individualSubmissionMessageWrapper {
		padding-left: 64px;
		padding-top: 2px;
		color: var(--vscode-charts-blue);
	}

	.individualSubmissionMessage {
		font-style: italic;
	}

	.highlight.correct {
		animation: highlightAnimationCorrect 2s ease;
	}

	.highlight.incorrect {
		animation: highlightAnimationIncorrect 2s ease;
	}

	.highlight.processing {
		animation: highlightAnimationProcessing 2s ease;
	}

	@keyframes highlightAnimationCorrect {
		from {
			background-color: var(--vscode-charts-green);
		}
	}

	@keyframes highlightAnimationIncorrect {
		from {
			background-color: var(--vscode-charts-red);
		}
	}

	@keyframes highlightAnimationProcessing {
		from {
			background-color: var(--vscode-charts-yellow);
		}
	}
</style>
