import * as vscode from 'vscode';
import { join } from 'path';
import { outputPanelLog } from '../common/output-panel-log';
import { TeamData } from '../common-types';
import { apiClient, extensionService, globalStateService, submitService } from '../services';
import { runJava } from 'bwcontest-shared/submission-runner/java';
import { runCSharp } from 'bwcontest-shared/submission-runner/csharp';
import { runCpp } from 'bwcontest-shared/submission-runner/cpp';
import { runPython } from 'bwcontest-shared/submission-runner/python';
import { RunnerResult, RunResult } from 'bwcontest-shared/submission-runner/common';
import { createHtmlForWebview } from '../common/utils';
import { ProblemPublic } from 'bwcontest-shared/types/problem';
import { MessageType, WebviewMessageType } from '../problem-panel-types';

type RunningProgram = {
	problemId: number;
	outputBuffer: string[];
	kill: () => void;
};

type ContestContext = {
	token: string | undefined;
	teamData: TeamData | undefined;
	problem: ProblemPublic | undefined;
};

export class ProblemPanelProvider {
	public static currentProvider: ProblemPanelProvider | undefined;

	private _runningProgram: RunningProgram | undefined;
	private _problemData: Array<ProblemPublic> | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _webUrl: string;

	private constructor(params: {
		panel: vscode.WebviewPanel;
		extensionUri: vscode.Uri;
		webUrl: string;
	}) {
		this._panel = params.panel;
		this._extensionUri = params.extensionUri;
		this._webUrl = params.webUrl;

		this._setupWebviewMessageListener();
		this._panel.webview.html = createHtmlForWebview({
			webview: this._panel.webview,
			extensionUri: this._extensionUri,
			entryName: 'problem-panel'
		});
		this._panel.onDidDispose(() => this._dispose());
	}

	public static show(context: vscode.ExtensionContext, webUrl: string): void {
		outputPanelLog.info('Showing BWPanel');
		const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;
		if (ProblemPanelProvider.currentProvider !== undefined) {
			ProblemPanelProvider.currentProvider._panel.reveal(column);
			return;
		}
		const panel = vscode.window.createWebviewPanel('bwpanel', 'BWContest', column, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [
				vscode.Uri.joinPath(context.extensionUri, 'media'),
				vscode.Uri.joinPath(context.extensionUri, 'dist/webviews')
			]
		});
		ProblemPanelProvider.currentProvider = new ProblemPanelProvider({
			panel,
			extensionUri: context.extensionUri,
			webUrl
		});
	}

	public static kill(): void {
		ProblemPanelProvider.currentProvider?._dispose();
	}

	private _dispose(): void {
		ProblemPanelProvider.currentProvider = undefined;
	}

	private _webviewPostMessage(m: WebviewMessageType): void {
		this._panel.webview.postMessage(m);
	}

	private _getContestContext(problemId?: number): ContestContext {
		const token = globalStateService.getToken();
		const teamData = globalStateService.getTeamData();
		const problem =
			problemId !== undefined ? this._problemData?.find((p) => p.id === problemId) : undefined;

		if (token === undefined) {
			console.error('No session token');
		}
		if (teamData === undefined) {
			console.error('No team data');
		}
		if (problemId !== undefined && problem === undefined) {
			console.error('Invalid problem id  or problem data is undefined');
		}
		return { token, teamData, problem };
	}

	private async handleSubmit(problemId: number): Promise<void> {
		const { token, teamData, problem } = this._getContestContext(problemId);
		if (token === undefined || teamData === undefined || problem === undefined) {
			return;
		}
		await vscode.workspace.saveAll();
		const answer = await vscode.window.showInformationMessage(
			`Are you sure you want to submit '${problem.friendlyName}'?`,
			{ modal: true },
			'Yes'
		);
		if (answer !== 'Yes') {
			return;
		}

		const submitResult = await submitService.submitProblem({
			token,
			contestId: teamData.contest.id,
			problemId,
			teamId: teamData.team.id
		});
		if (!submitResult.success) {
			vscode.window.showErrorMessage(`Web error submitting '${problem.friendlyName}'`);
			outputPanelLog.error(
				`Web error submitting '${problem.friendlyName}': ${submitResult.message}`
			);
		}
	}

	private async _handleRun(problemId: number, input: string): Promise<void> {
		if (this._runningProgram) {
			vscode.window.showErrorMessage('A program is already running');
			return;
		}
		const { teamData, problem } = this._getContestContext(problemId);
		if (teamData === undefined || problem === undefined) {
			return;
		}
		await vscode.workspace.saveAll();
		this._webviewPostMessage({ msg: 'onRunning' });
		this._webviewPostMessage({ msg: 'onRunningOutput', data: '[Compiling...]' });
		const repoDir = extensionService.getSettings().repoClonePath;
		const outputBuffer: Array<string> = [];
		const teamBasePath = join(
			repoDir,
			'BWContest',
			teamData.contest.id.toString(),
			teamData.team.id.toString()
		);
		const studentCodeRootForProblem = join(teamBasePath, problem.pascalName);
		const outputCallback = (data: string) => {
			outputBuffer.push(data);
			this._webviewPostMessage({ msg: 'onRunningOutput', data: outputBuffer.join('') });
		};
		let runResponse: RunnerResult | undefined;
		try {
			switch (teamData.team.language) {
				case 'java':
					runResponse = await runJava({
						input,
						studentCodeRootForProblem,
						mainClass: problem.pascalName,
						mainFile: join(studentCodeRootForProblem, `${problem.pascalName}.java`),
						srcDir: studentCodeRootForProblem,
						outputCallback
					});
					break;
				case 'csharp':
					runResponse = await runCSharp({
						input,
						studentCodeRootForProblem,
						srcDir: studentCodeRootForProblem,
						outputCallback
					});
					break;
				case 'cpp':
					runResponse = await runCpp({
						input,
						studentCodeRootForProblem,
						cppPlatform: process.platform === 'win32' ? 'VisualStudio' : 'GCC',
						problemName: problem.pascalName,
						srcDir: teamBasePath,
						outputCallback
					});
					break;
				case 'python':
					runResponse = await runPython({
						input,
						studentCodeRootForProblem,
						problemName: problem.pascalName,
						srcDir: studentCodeRootForProblem,
						outputCallback
					});
					break;
				default:
					throw new Error(`Unsupported language: ${teamData.team.language}`);
			}

			if (!runResponse.success) {
				this._webviewPostMessage({
					msg: 'onRunningOutput',
					data: this._formatRunResultMessage(runResponse.runResult)
				});
				this._webviewPostMessage({ msg: 'onRunningDone' });
				return;
			}

			this._runningProgram = {
				problemId,
				outputBuffer,
				kill: runResponse.killFunc
			};

			runResponse.runResult
				.then((runResult) => {
					if (runResult.kind === 'timeLimitExceeded') {
						this._postOutputWithTimeLimitExceededNotice(outputBuffer);
					}
				})
				.catch((err) => {
					outputPanelLog.error(`Execution promise rejected: ${err}`);
					this._webviewPostMessage({
						msg: 'onRunningOutput',
						data: `\n[Fatal Extension Error]`
					});
				})
				.finally(() => {
					this._runningProgram = undefined;
					this._webviewPostMessage({ msg: 'onRunningDone' });
				});
		} catch (e) {
			outputPanelLog.error(`Failed to launch runner: ${e}`);
			this._webviewPostMessage({
				msg: 'onRunningOutput',
				data: `\n[Failed to launch program]`
			});
			this._webviewPostMessage({ msg: 'onRunningDone' });
			this._runningProgram = undefined;
		}
	}

	private _formatRunResultMessage(runResult: RunResult): string {
		switch (runResult.kind) {
			case 'compileFailed':
				return 'Compilation Error:\n' + runResult.resultKindReason;
			case 'runError':
				return 'Environment Error:\n' + runResult.resultKindReason;
			default:
				return `${runResult.kind}:\n${runResult.output}`;
		}
	}

	private _postOutputWithTimeLimitExceededNotice(outputBuffer: string[]): void {
		this._webviewPostMessage({
			msg: 'onRunningOutput',
			data: outputBuffer.join('') + '\n---\nTime Limit Exceeded'
		});
	}

	private async _handleRequestProblemData(): Promise<void> {
		const dataRes = await apiClient.getData();
		if (dataRes.success) {
			this._problemData = dataRes.data.problems;
			this._webviewPostMessage({ msg: 'onProblemData', data: dataRes.data.problems });
		}
	}

	private _setupWebviewMessageListener(): void {
		this._panel.webview.onDidReceiveMessage(async (m: MessageType) => {
			switch (m.msg) {
				case 'onKill':
					this._runningProgram?.kill();
					break;
				case 'onSubmit':
					await this.handleSubmit(m.data.problemId);
					break;
				case 'onRun':
					await this._handleRun(m.data.problemId, m.data.input);
					break;
				case 'onRequestProblemData':
					await this._handleRequestProblemData();
					break;
			}
		});
	}
}
