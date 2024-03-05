import * as vscode from 'vscode';
import urlJoin from 'url-join';
import outputPanelLog from '../outputPanelLog';
import { extensionSettings } from '../extension';
import { ContestStateForExtension, ProblemNameForExtension, FullStateForExtension, SubmissionForExtension } from './contestMonitorSharedTypes';
import { LiteEvent } from '../utilities/LiteEvent';

export type ContestTeamState = {
    contestState: ContestStateForExtension,
    submissionsList: Map<number, SubmissionForExtension[]>
}

export type SubmissionListStateChangedEventArgs = {
    contestTeamState: ContestTeamState,
    changedProblemIds: Set<number>
}

let latestContestTeamState: ContestTeamState | null = null;

export function getCachedContestTeamState(): ContestTeamState | null {
    return latestContestTeamState;
}

const onSubmissionsListChanged = new LiteEvent<SubmissionListStateChangedEventArgs>();
export const submissionsListChanged = onSubmissionsListChanged.expose();

let latestPollNum = 0;
export async function pollContestStatus(context: vscode.ExtensionContext) {
    const pollNum = ++latestPollNum;
    outputPanelLog.trace(`Polling contest status, poll #${pollNum}`);

	const sessionToken = context.globalState.get('token');
	if (!sessionToken) {
        outputPanelLog.trace(`  Ending poll #${pollNum}: No sessionToken`);
		return;
	}

    const contestStateResponse = await fetch(urlJoin(extensionSettings().webUrl, `api/team/${sessionToken}/contestState`), {
        method: 'GET'
    });

	if (contestStateResponse.status != 200) {
        outputPanelLog.trace(`  Ending poll #${pollNum}: Status check API returned http status ${contestStateResponse.status}`);
		return;
	}

	const data = await contestStateResponse.json();
	if (!data.success) {
        outputPanelLog.trace(`  Ending poll #${pollNum}: Status check returned OK but was not successful`);
		return;
	}

    const fullState: FullStateForExtension = data.data;
    outputPanelLog.trace(`  Poll #${pollNum} succeeded. Submission count: ${fullState.submissions.length}. Diffing...`);

    diffAndUpdateContestState(fullState);
}

function diffAndUpdateContestState(fullState: FullStateForExtension) {
    const contestState = fullState.contestState;
    const currentSubmissionsList = createProblemSubmissionsLookup(contestState.problems, fullState.submissions);
    const changedProblemIds = new Set<number>();

    let anythingChanged = false;
    if (latestContestTeamState == null) {
        outputPanelLog.trace(`    No previously cached data to diff`);
        anythingChanged = true;
    } 
    else {
        for (const problem of contestState.problems) {
            const problemId = problem.id;
            const currentSubmissionsForProblem = currentSubmissionsList.get(problemId) ?? [];
            const cachedSubmissionsForProblem = latestContestTeamState.submissionsList.get(problemId) ?? [];

            const currentSubmissionsAlreadyInCache = currentSubmissionsForProblem!.filter(s => cachedSubmissionsForProblem.find(ss => ss.id == s.id));
            const currentSubmissionsNotInCache = currentSubmissionsForProblem!.filter(s => !cachedSubmissionsForProblem.find(ss => ss.id == s.id));
            const cachedSubmissionsNotInCurrent = cachedSubmissionsForProblem.filter(s => !currentSubmissionsForProblem!.find(ss => ss.id == s.id));

            for (const currentSubmission of currentSubmissionsAlreadyInCache ) {
                const previousSubmission = cachedSubmissionsForProblem.find(s => s.id == currentSubmission.id)!;
                if (currentSubmission.state != previousSubmission.state) {
                    anythingChanged = true;
                    changedProblemIds.add(problem.id);
                    outputPanelLog.trace(`    Submission state for #${currentSubmission.id} changed from ${previousSubmission.state} (message '${previousSubmission.message}') to ${currentSubmission.state} (message '${currentSubmission.message}')`);
                    alertForNewState(problem, currentSubmission);
                } else if (currentSubmission.message != previousSubmission.message) {
                    anythingChanged = true;
                    changedProblemIds.add(problem.id);
                    outputPanelLog.trace(`    Submission message changed (with same state) for #${currentSubmission.id} from ${previousSubmission.message} to ${currentSubmission.message}`);
                }
            }

            for (const currentSubmission of currentSubmissionsNotInCache ) {
                anythingChanged = true;
                changedProblemIds.add(problem.id);
                outputPanelLog.trace(`    Newly acknowledge submission #${currentSubmission.id} with state ${currentSubmission.state} and message ${currentSubmission.message}`);
                alertForNewState(problem, currentSubmission);
            }

            for (const previousSubmission of cachedSubmissionsNotInCurrent ) {
                anythingChanged = true;
                outputPanelLog.trace(`    Deleted submission #${previousSubmission.id}`);
            }
        }
    }

    outputPanelLog.trace(anythingChanged ? "  Diff has changes, triggering events" : "  No changes found");
    
    if (anythingChanged) {
        latestContestTeamState = { contestState, submissionsList: currentSubmissionsList};
        onSubmissionsListChanged.trigger({
            contestTeamState: latestContestTeamState,
            changedProblemIds
        });
    }
}

function createProblemSubmissionsLookup(problems: ProblemNameForExtension[], submissions: SubmissionForExtension[]): Map<number, SubmissionForExtension[]> {
    const orderedSubmissionsByProblemId = new Map<number, SubmissionForExtension[]>();
    for (const problem of problems) {
        orderedSubmissionsByProblemId.set(problem.id, []);
    }

    for (const submission of submissions.sort(s => s.id)) {
        orderedSubmissionsByProblemId.get(submission.problemId)!.push(submission);
    }

    return orderedSubmissionsByProblemId;
}

function alertForNewState(problem: ProblemNameForExtension, currentSubmission: SubmissionForExtension) {
    // Only alert on state changes team cares about
    if (currentSubmission.state === 'Correct') {
        vscode.window.showInformationMessage(`BWContest Judge: CORRECT Submission '${problem.friendlyName}'`);
    } else if (currentSubmission.state === 'Incorrect') {
        const messageDisplayText = currentSubmission.message ? `Message: ${currentSubmission.message}` : '';
        vscode.window.showInformationMessage(`BWContest Judge: INCORRECT Submission '${problem.friendlyName}' ${messageDisplayText}`);
    }
}

export function recordInitialSubmission(submission: SubmissionForExtension): void {    
    outputPanelLog.trace("Server received new submission, #" + submission.id);

    if (!latestContestTeamState) {
        outputPanelLog.trace("  No locally cached submission list state, the normal polling cycle will update the list");
        return;
    }

    const existingSubmissionListForProblem = latestContestTeamState.submissionsList.get(submission.problemId);
    if (existingSubmissionListForProblem === undefined) {
        outputPanelLog.trace(`  The cached submission list does not know about problemId #${submission.problemId}. Next polling cycle should fix consistency.`);
        return;
    }

    if (existingSubmissionListForProblem.find(s => s.id == submission.id)) {
        outputPanelLog.trace(`  The cached submission list already knows about submissionId #${submission.id}`);
        return;
    }

    outputPanelLog.trace(`  New submission #${submission.id} added to cache, triggering events`);
    existingSubmissionListForProblem.push(submission);
    onSubmissionsListChanged.trigger({
        contestTeamState: latestContestTeamState,
        changedProblemIds: new Set<number>([submission.problemId]),
    });
}