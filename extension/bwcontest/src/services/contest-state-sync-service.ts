import { outputPanelLog } from '../common/output-panel-log';
import { apiClient, globalStateService } from '.';
import { TeamData } from '../types';
import { ProblemPublic } from 'bwcontest-shared/types/problem';
import { Submission } from 'bwcontest-shared/types/submission';
import * as vscode from 'vscode';
import { LiteEvent } from '../common/lite-event';

export type ContestTeamState = {
	teamData: TeamData;
	submissionsList: Map<number, Array<Submission>>;
};

export type OnSubmissionListStateChangeData = {
	contestTeamState: ContestTeamState;
	changedProblemIds: Set<number>;
};

export class ContestStateSyncService {
	private _latestPollNum = 0;
	private _latestContestTeamState: ContestTeamState | undefined;
	private _onSubmissionsListChange = new LiteEvent<OnSubmissionListStateChangeData>();

	public onSUbmissionsListChange = this._onSubmissionsListChange.expose();

	public async pollContestStatus(): Promise<void> {
		const pollNum = ++this._latestPollNum;
		outputPanelLog.trace(`Polling contest status, poll #${pollNum}`);
		const token = globalStateService.getToken();
		if (token === undefined) {
			outputPanelLog.trace(`  Ending poll #${pollNum}: No sessionToken`);
			return;
		}
		const dataRes = await apiClient.getData();
		if (!dataRes.success) {
			outputPanelLog.trace(`  Ending poll #${pollNum}: Failed: ${dataRes.message}`);
			return;
		}
		outputPanelLog.trace(
			`  Poll #${pollNum} succeeded. Submission count: ${dataRes.data.submissions.length}. Diffing...`
		);
		this._diffAndUpdateContestState(dataRes.data);
	}

	public getCachedContestTeamState(): ContestTeamState | undefined {
		return this._latestContestTeamState;
	}

	public clearCachedContestTeamState(): void {
		this._latestContestTeamState = undefined;
	}

	public recordInitialSubmission(submission: Submission): void {
		outputPanelLog.trace('Server received new submission, #' + submission.id);

		if (this._latestContestTeamState === undefined) {
			outputPanelLog.trace(
				'  No locally cached submission list state, the normal polling cycle will update the list'
			);
			return;
		}

		const existingSubmissionListForProblem = this._latestContestTeamState.submissionsList.get(
			submission.problemId
		);
		if (existingSubmissionListForProblem === undefined) {
			outputPanelLog.trace(
				`  The cached submission list does not know about problemId #${submission.problemId}. Next polling cycle should fix consistency.`
			);
			return;
		}

		if (existingSubmissionListForProblem.find((s) => s.id === submission.id)) {
			outputPanelLog.trace(
				`  The cached submission list already knows about submissionId #${submission.id}`
			);
			return;
		}

		outputPanelLog.trace(`  New submission #${submission.id} added to cache, triggering events`);
		existingSubmissionListForProblem.push(submission);
		this._onSubmissionsListChange.trigger({
			contestTeamState: this._latestContestTeamState,
			changedProblemIds: new Set<number>([submission.problemId])
		});
	}

	private _diffAndUpdateContestState(teamData: TeamData): void {
		const currentSubmissionsList = this._createProblemSubmissionsLookup({
			problems: teamData.problems,
			submissions: teamData.submissions
		});
		const changedProblemIds = new Set<number>();

		let anythingChanged = false;
		if (this._latestContestTeamState === undefined) {
			outputPanelLog.trace(`    No previously cached data to diff`);
			anythingChanged = true;
		} else {
			for (const problem of teamData.problems) {
				const problemId = problem.id;
				const currentSubmissionsForProblem = currentSubmissionsList.get(problemId) ?? [];
				const cachedSubmissionsForProblem =
					this._latestContestTeamState.submissionsList.get(problemId) ?? [];

				const currentSubmissionsAlreadyInCache = currentSubmissionsForProblem.filter((s) =>
					cachedSubmissionsForProblem.find((ss) => ss.id === s.id)
				);
				const currentSubmissionsNotInCache = currentSubmissionsForProblem.filter(
					(s) => !cachedSubmissionsForProblem.find((ss) => ss.id === s.id)
				);
				const cachedSubmissionsNotInCurrent = cachedSubmissionsForProblem.filter(
					(s) => !currentSubmissionsForProblem.find((ss) => ss.id === s.id)
				);

				for (const currentSubmission of currentSubmissionsAlreadyInCache) {
					const previousSubmission = cachedSubmissionsForProblem.find(
						(s) => s.id === currentSubmission.id
					)!;
					if (currentSubmission.state !== previousSubmission.state) {
						anythingChanged = true;
						changedProblemIds.add(problem.id);
						outputPanelLog.trace(
							`    Submission state for #${currentSubmission.id} changed from ${previousSubmission.state} (message '${previousSubmission.message}') to ${currentSubmission.state} (message '${currentSubmission.message}')`
						);
						this._alertForNewState({ problem, currentSubmission });
					} else if (currentSubmission.message !== previousSubmission.message) {
						anythingChanged = true;
						changedProblemIds.add(problem.id);
						outputPanelLog.trace(
							`    Submission message changed (with same state) for #${currentSubmission.id} from ${previousSubmission.message} to ${currentSubmission.message}`
						);
					}
				}

				for (const currentSubmission of currentSubmissionsNotInCache) {
					anythingChanged = true;
					changedProblemIds.add(problem.id);
					outputPanelLog.trace(
						`    Newly acknowledge submission #${currentSubmission.id} with state ${currentSubmission.state} and message ${currentSubmission.message}`
					);
					this._alertForNewState({ problem, currentSubmission });
				}

				for (const previousSubmission of cachedSubmissionsNotInCurrent) {
					anythingChanged = true;
					outputPanelLog.trace(`    Deleted submission #${previousSubmission.id}`);
				}
			}
		}

		outputPanelLog.trace(
			anythingChanged ? '  Diff has changes, triggering events' : '  No changes found'
		);

		if (anythingChanged) {
			this._latestContestTeamState = { teamData, submissionsList: currentSubmissionsList };
			this._onSubmissionsListChange.trigger({
				contestTeamState: this._latestContestTeamState,
				changedProblemIds
			});
		}
	}

	private _createProblemSubmissionsLookup(params: {
		problems: Array<ProblemPublic>;
		submissions: Array<Submission>;
	}): Map<number, Array<Submission>> {
		const orderedSubmissionsByProblemId = new Map<number, Array<Submission>>();
		for (const problem of params.problems) {
			orderedSubmissionsByProblemId.set(problem.id, []);
		}
		for (const submission of params.submissions.sort((s) => s.id)) {
			orderedSubmissionsByProblemId.get(submission.problemId)?.push(submission);
		}
		return orderedSubmissionsByProblemId;
	}

	private _alertForNewState(params: {
		problem: ProblemPublic;
		currentSubmission: Submission;
	}): void {
		// Only alert on state changes team cares about
		if (params.currentSubmission.state === 'correct') {
			vscode.window.showInformationMessage(
				`BWContest Judge: CORRECT Submission '${params.problem.friendlyName}'`
			);
		} else if (params.currentSubmission.state === 'incorrect') {
			const messageDisplayText =
				params.currentSubmission.message !== null
					? `Message: ${params.currentSubmission.message}`
					: '';
			vscode.window.showInformationMessage(
				`BWContest Judge: INCORRECT Submission '${params.problem.friendlyName}' ${messageDisplayText}`
			);
		}
	}
}
