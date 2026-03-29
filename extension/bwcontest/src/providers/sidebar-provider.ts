import * as vscode from 'vscode';
import { TeamData } from '../types';
import { outputPanelLog } from '../common/output-panel-log';
import { ProblemPanelProvider } from './problem-panel-provider';
import { createHtmlForWebview } from '../common/utils';
import {
	apiClient,
	contestStateSyncService,
	globalStateService,
	pollingService,
	teamRepoService
} from '../services';
import { RepoState } from '../services/team-repo-service';
import { ContestTeamState } from '../services/contest-state-sync-service';
import { Submission } from 'bwcontest-shared/types/submission';
import { ProblemPublic } from 'bwcontest-shared/types/problem';
import { Contest } from 'bwcontest-shared/types/contest';

export type WebviewMessageType =
	| { msg: 'onLogin'; data: TeamData }
	| { msg: 'onLogout' }
	| { msg: 'teamStatusUpdated'; data: SidebarTeamStatus | null }
	| { msg: 'repoStateUpdated'; data: RepoState };

export type MessageType =
	| { msg: 'onTestAndSubmit' }
	| { msg: 'onUIMount' }
	| { msg: 'onCloneOpenRepo'; data: { contestId: number; teamId: number } }
	| { msg: 'onCloneRepo'; data: { contestId: number; teamId: number } }
	| { msg: 'onOpenRepo'; data: { contestId: number; teamId: number } }
	| { msg: 'onLogin'; data: { teamName: string; password: string } }
	| { msg: 'onLogout' };

export type SidebarTeamStatus = {
	contestState: Contest;
	correctProblems: Array<SidebarProblemWithSubmissions>;
	processingProblems: Array<SidebarProblemWithSubmissions>;
	incorrectProblems: Array<SidebarProblemWithSubmissions>;
	notStartedProblems: Array<SidebarProblemWithSubmissions>;
};

export type SubmissionDisplayState = 'Processing' | 'Correct' | 'Incorrect';

export type SidebarProblemWithSubmissions = {
	problem: ProblemPublic;
	overallState: SubmissionDisplayState | undefined;
	submissions: Array<Submission>;
	modified: boolean;
};

export class SidebarProvider implements vscode.WebviewViewProvider {
	private _webview: vscode.Webview | undefined;
	private readonly _extensionUri: vscode.Uri;
	private readonly _context: vscode.ExtensionContext;
	private readonly _webUrl: string;

	constructor(params: {
		extensionUri: vscode.Uri;
		context: vscode.ExtensionContext;
		webUrl: string;
	}) {
		this._extensionUri = params.extensionUri;
		this._context = params.context;
		this._webUrl = params.webUrl;

		outputPanelLog.info('Constructing SidebarProvider');
		const currentSubmissionsList = contestStateSyncService.getCachedContestTeamState();
		outputPanelLog.info(
			'When SidebarProvider constructed, cached submission list is: ' +
				JSON.stringify(currentSubmissionsList)
		);
		this.updateTeamStatus({
			contestTeamState: currentSubmissionsList,
			changedProblemIds: new Set<number>()
		});
		contestStateSyncService.onSUbmissionsListChange.add((submissionsChangedEventArgs) => {
			outputPanelLog.trace('Sidebar submission list updating from submissionsListChanged event');

			if (!submissionsChangedEventArgs) {
				return;
			}

			this.updateTeamStatus({
				contestTeamState: submissionsChangedEventArgs.contestTeamState,
				changedProblemIds: submissionsChangedEventArgs.changedProblemIds
			});
		});

		const currentRepoState = teamRepoService.getCachedRepoState();
		outputPanelLog.info(
			'When SidebarProvider constructed, cached repo state is: ' + currentRepoState
		);
		this.updateRepoStatus(currentRepoState);

		teamRepoService.onRepoStateChange.add((repoChangedEventArgs) => {
			outputPanelLog.trace('Repo status updating from event');
			if (!repoChangedEventArgs) {
				return;
			}
			this.updateRepoStatus(repoChangedEventArgs.state);
		});
	}

	private async _handleLogin(params: {
		teamName: string;
		password: string;
		webviewPostMessage: (m: WebviewMessageType) => void;
	}) {
		const loginRes = await apiClient.login({
			teamName: params.teamName,
			password: params.password
		});
		if (!loginRes.success || loginRes.data.activeTeam.sessionToken === null) {
			outputPanelLog.error(
				`Unable to login: ${loginRes.success ? 'token is null' : loginRes.message}`
			);
			vscode.window.showErrorMessage(
				`BWContest: Login Failure: ${loginRes.success ? 'token is null' : loginRes.message}`
			);
			return;
		}
		await globalStateService.setToken(loginRes.data.activeTeam.sessionToken);

		const dataRes = await apiClient.getData();
		if (!dataRes.success) {
			outputPanelLog.error(`Unable to get contest data: ${dataRes.message}`);
			vscode.window.showErrorMessage(`BWContest: Unable to fetch data: ${dataRes.message}`);
			return;
		}
		await globalStateService.setTeamData(dataRes.data);

		await pollingService.startTeamStatusPolling();

		outputPanelLog.info('Login succeeded');
		params.webviewPostMessage({ msg: 'onLogin', data: dataRes.data });

		const currentSubmissionsList = contestStateSyncService.getCachedContestTeamState();
		outputPanelLog.info(
			'After login, cached submission list is: ' + JSON.stringify(currentSubmissionsList)
		);
		this.updateTeamStatus({
			contestTeamState: currentSubmissionsList,
			changedProblemIds: new Set<number>()
		});

		const currentRepoState = teamRepoService.getCachedRepoState();
		outputPanelLog.info('After login, cached repo state is: ' + currentRepoState);
		this.updateRepoStatus(currentRepoState);
		await teamRepoService.refreshRepoState();
	}

	private async _handleLogout(params: { webviewPostMessage: (m: WebviewMessageType) => void }) {
		const token = globalStateService.getToken();
		if (token === undefined) {
			outputPanelLog.error(
				'Team requested logout, but no token was stored locally. Switching to logged out state.'
			);
			await this._clearLocalTeamDataAndFinishLogout({
				webviewPostMessage: params.webviewPostMessage
			});
			return;
		}
		const teamData = globalStateService.getTeamData();
		if (teamData === undefined) {
			outputPanelLog.error(
				'Team requested logout with a locally stored token but no teamData. Switching to logged out state.'
			);
			await this._clearLocalTeamDataAndFinishLogout({
				webviewPostMessage: params.webviewPostMessage
			});
			return;
		}
		const logoutRes = await apiClient.logout();
		if (!logoutRes.success) {
			outputPanelLog.error('Team requested logout, failed. Not modifying local state');
			vscode.window.showErrorMessage(`BWContest: Logout failed`);
			return;
		}
		outputPanelLog.info('Team requested logout, completed successfully');
		await this._clearLocalTeamDataAndFinishLogout({
			webviewPostMessage: params.webviewPostMessage
		});
	}

	private async _clearLocalTeamDataAndFinishLogout(params: {
		webviewPostMessage: (m: WebviewMessageType) => void;
	}) {
		params.webviewPostMessage({ msg: 'onLogout' });

		pollingService.stopTeamStatusPolling();
		contestStateSyncService.clearCachedContestTeamState();

		teamRepoService.clearCachedRepoState();

		await globalStateService.setToken(undefined);
		await globalStateService.setTeamData(undefined);
	}

	public updateTeamStatus(params: {
		contestTeamState: ContestTeamState | undefined;
		changedProblemIds: Set<number>;
	}) {
		if (params.contestTeamState === undefined) {
			outputPanelLog.trace(
				'Not updating sidebar submission list because provided state is undefined'
			);
			return;
		}

		if (this._webview === undefined) {
			outputPanelLog.trace('Not updating sidebar submission list because webview is undefined');
			return;
		}

		const problemsWithSubmissions = params.contestTeamState.teamData.problems.map((p) => ({
			problem: p,
			overallState: this._calculateOverallState(
				params.contestTeamState?.submissionsList.get(p.id) ?? []
			),
			submissions: params.contestTeamState?.submissionsList.get(p.id) ?? [],
			modified: params.changedProblemIds.has(p.id)
		}));

		const teamStatus: SidebarTeamStatus = {
			contestState: params.contestTeamState.teamData.contest,
			correctProblems: problemsWithSubmissions.filter((p) => p.overallState === 'Correct'),
			processingProblems: problemsWithSubmissions.filter((p) => p.overallState === 'Processing'),
			incorrectProblems: problemsWithSubmissions.filter((p) => p.overallState === 'Incorrect'),
			notStartedProblems: problemsWithSubmissions.filter((p) => p.overallState === null)
		};

		const message: WebviewMessageType = {
			msg: 'teamStatusUpdated',
			data: teamStatus
		};

		outputPanelLog.trace(
			'Posting teamStatusUpdated to webview with message: ' + JSON.stringify(message)
		);
		this._webview.postMessage(message);
	}

	public updateRepoStatus(state: RepoState) {
		if (this._webview === undefined) {
			outputPanelLog.trace('Not updating sidebar repo state because webview is undefined');
			return;
		}

		const message: WebviewMessageType = {
			msg: 'repoStateUpdated',
			data: state
		};

		outputPanelLog.trace(
			'Posting repoStateUpdated to webview with message: ' + JSON.stringify(message)
		);

		this._webview.postMessage(message);
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		outputPanelLog.trace('SidebarProvider resolveWebviewView');
		const webview = webviewView.webview;
		this._webview = webview;
		webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri]
		};
		webview.html = createHtmlForWebview({
			webview,
			extensionUri: this._extensionUri,
			entryName: 'sidebar'
		});

		const webviewPostMessage = (m: WebviewMessageType) => {
			webview.postMessage(m);
		};

		webview.onDidReceiveMessage(async (m: MessageType) => {
			switch (m.msg) {
				case 'onTestAndSubmit': {
					ProblemPanelProvider.show(this._context, this._webUrl);
					break;
				}
				case 'onUIMount': {
					outputPanelLog.trace('SidebarProvider onUIMount');
					const token = globalStateService.getToken();
					const teamData = globalStateService.getTeamData();
					if (token !== undefined && teamData !== undefined) {
						webviewPostMessage({
							msg: 'onLogin',
							data: teamData
						});

						const currentSubmissionsList = contestStateSyncService.getCachedContestTeamState();
						outputPanelLog.trace(
							'onUIMount, currentSubmissionsList is ' + JSON.stringify(currentSubmissionsList)
						);
						this.updateTeamStatus({
							contestTeamState: currentSubmissionsList,
							changedProblemIds: new Set<number>()
						});

						const currentRepoState = teamRepoService.getCachedRepoState();
						outputPanelLog.trace('onUIMount, currentRepoState is ' + currentRepoState);
						this.updateRepoStatus(currentRepoState);
					}
					break;
				}
				case 'onCloneOpenRepo': {
					await teamRepoService.cloneOpenRepo({
						contestId: m.data.contestId,
						teamId: m.data.teamId
					});
					break;
				}
				case 'onCloneRepo': {
					await teamRepoService.cloneRepo({ contestId: m.data.contestId, teamId: m.data.teamId });
					break;
				}
				case 'onOpenRepo': {
					await teamRepoService.openRepo({ contestId: m.data.contestId, teamId: m.data.teamId });
					break;
				}
				case 'onLogin': {
					await this._handleLogin({
						teamName: m.data.teamName,
						password: m.data.password,
						webviewPostMessage: webviewPostMessage
					});
					break;
				}
				case 'onLogout': {
					await this._handleLogout({ webviewPostMessage });
					break;
				}
			}
		});
	}

	private _calculateOverallState(
		submissions: Array<Submission>
	): SubmissionDisplayState | undefined {
		if (submissions.find((s) => s.state === 'correct')) {
			return 'Correct';
		} else if (submissions.find((s) => s.state === 'queued' || s.state === 'in_review')) {
			return 'Processing';
		} else if (submissions.find((s) => s.state === 'incorrect')) {
			return 'Incorrect';
		} else {
			return undefined;
		}
	}
}
