import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import urlJoin from 'url-join';
import { extensionSettings } from './extension';
import { runJava } from 'bwcontest-shared/submission-runner/java.cjs';
import { join } from 'path';
import { submitProblem } from './submit';
import { runCSharp } from 'bwcontest-shared/submission-runner/csharp.cjs';
import { runCpp } from 'bwcontest-shared/submission-runner/cpp.cjs';
import { TeamData } from './sharedTypes';
import outputPanelLog from './outputPanelLog';
import { recordInitialSubmission } from './contestMonitor/contestStateSyncManager';

export type ProblemData = {
	id: number;
	name: string;
	pascalName: string;
	sampleInput: string;
	sampleOutput: string;
}[];

export type MessageType =
	| { msg: 'onRequestProblemData' }
	| { msg: 'onRun'; data: { problemId: number; input: string } }
	| { msg: 'onKill' }
	| { msg: 'onSubmit'; data: { problemId: number } };
export type WebviewMessageType =
	| { msg: 'onProblemData'; data: ProblemData }
	| { msg: 'onRunning' }
	| { msg: 'onRunningDone' }
	| { msg: 'onRunningOutput'; data: string };

type RunningProgram = {
	problemId: number;
	outputBuffer: string[];
	kill: () => void;
};

/**
 * Singleton class for problem panel
 */
export class BWPanel {
	public static currentPanel: BWPanel | undefined;

	private runningProgram: RunningProgram | undefined;
	private problemData: ProblemData | undefined;

	private constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly panel: vscode.WebviewPanel,
		private readonly extensionUri: vscode.Uri,
		private readonly webUrl: string
	) {
		this.update();
		panel.onDidDispose(() => this.dispose());
	}

	public static show(context: vscode.ExtensionContext, webUrl: string) {
		outputPanelLog.info('Showing BWPanel');
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// Show panel if exists
		if (BWPanel.currentPanel !== undefined) {
			BWPanel.currentPanel.panel.reveal(column);
			return;
		}

		// Otherwise create new panel
		const panel = vscode.window.createWebviewPanel(
			'bwpanel',
			'BWContest',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					vscode.Uri.joinPath(context.extensionUri, 'media'),
					vscode.Uri.joinPath(context.extensionUri, 'out/compiled')
				]
			}
		);

		BWPanel.currentPanel = new BWPanel(context, panel, context.extensionUri, webUrl);
	}

	public static kill() {
		BWPanel.currentPanel?.dispose();
		BWPanel.currentPanel = undefined;
	}

	public dispose() {
		BWPanel.currentPanel = undefined;
	}

	private webviewPostMessage(m: WebviewMessageType) {
		this.panel.webview.postMessage(m);
	}

	private async handleSubmit(problemId: number) {
		if (this.problemData === undefined) {
			console.error('Problem data undefined');
			return;
		}
		const problem = this.problemData.find((p) => p.id === problemId);
		if (problem === undefined) {
			console.error('Invalid problem Id');
			return;
		}
		const sessionToken = this.context.globalState.get<string>('token');
		if (sessionToken === undefined) {
			console.error('No session token');
			return;
		}
		const teamData = this.context.globalState.get<TeamData>('teamData');
		if (teamData === undefined) {
			console.error('No team data');
			return;
		}
		await vscode.workspace.saveAll();
		const ans = await vscode.window.showInformationMessage(
			`Are you sure you want to submit '${problem.name}'?`,
			'Yes',
			'No'
		);
		if (ans !== 'Yes') {
			return;
		}

		try {
			const submissionResult = await submitProblem(
				sessionToken,
				teamData.contestId,
				teamData.teamId,
				problemId
			);
			if (submissionResult.success === true) {
				recordInitialSubmission(submissionResult.submission);
				vscode.window.showInformationMessage(`Submitted '${problem.name}'!`);
			} else {
				vscode.window.showErrorMessage(
					`Error submitting '${problem.name}': ${submissionResult.message}`
				);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Web error submitting '${problem.name}'`);
			outputPanelLog.error(`Web error submitting '${problem.name}': ${error}`);
		}
	}

	private async handleRun(problemId: number, input: string) {
		const teamData: TeamData | undefined = this.context.globalState.get('teamData');
		if (teamData === undefined) {
			return;
		}
		if (this.problemData === undefined) {
			return;
		}
		if (this.runningProgram !== undefined) {
			vscode.window.showErrorMessage('Already Running');
			return;
		}
		const problem = this.problemData.find((p) => p.id === problemId);
		if (problem === undefined) {
			return;
		}
		await vscode.workspace.saveAll();
		const repoDir = extensionSettings().repoClonePath;
		const outputBuffer: string[] = [];
		this.webviewPostMessage({ msg: 'onRunning' });
		this.webviewPostMessage({ msg: 'onRunningOutput', data: '[Compiling...]' });

		let killFunc: (() => void) | undefined;

		const studentCodeRootForProblem = join(
			repoDir,
			'BWContest',
			teamData.contestId.toString(),
			teamData.teamId.toString(),
			problem.pascalName);

		if (teamData.language === 'Java') {
			const res = await runJava({
				input,
				studentCodeRootForProblem,
				mainClass: problem.pascalName,
				mainFile: join(
					repoDir,
					'BWContest',
					teamData.contestId.toString(),
					teamData.teamId.toString(),
					problem.pascalName,
					`${problem.pascalName}.java`
				),
				srcDir: join(
					repoDir,
					'BWContest',
					teamData.contestId.toString(),
					teamData.teamId.toString(),
					problem.pascalName
				),
				outputCallback: (data) => {
					outputBuffer.push(data);
					this.webviewPostMessage({ msg: 'onRunningOutput', data: outputBuffer.join('') });
				}
			});
			if (res.success === true) {
				killFunc = res.killFunc;
				res.runResult.then(() => {
					this.runningProgram = undefined;
					this.webviewPostMessage({ msg: 'onRunningDone' });
				});
			} else {
				this.runningProgram = undefined;
				this.webviewPostMessage({
					msg: 'onRunningOutput',
					data: `${res.runResult.kind}:\n${res.runResult.output}`
				});
				this.webviewPostMessage({ msg: 'onRunningDone' });
			}
		} else if (teamData.language === 'CSharp') {
			const res = await runCSharp({
				input,
				studentCodeRootForProblem,
				srcDir: join(
					repoDir,
					'BWContest',
					teamData.contestId.toString(),
					teamData.teamId.toString(),
					problem.pascalName
				),
				outputCallback: (data) => {
					outputBuffer.push(data);
					this.webviewPostMessage({ msg: 'onRunningOutput', data: outputBuffer.join('') });
				}
			});
			if (res.success === true) {
				killFunc = res.killFunc;
				res.runResult.then(() => {
					this.runningProgram = undefined;
					this.webviewPostMessage({ msg: 'onRunningDone' });
				});
			} else {
				this.runningProgram = undefined;
				this.webviewPostMessage({
					msg: 'onRunningOutput',
					data: `${res.runResult.kind}:\n${res.runResult.output}`
				});
				this.webviewPostMessage({ msg: 'onRunningDone' });
			}
		} else if (teamData.language === 'CPP') {
			const res = await runCpp({
				input,
				studentCodeRootForProblem,
				cppPlatform: process.platform === 'win32' ? 'VisualStudio' : 'GCC',
				problemName: problem.pascalName,
				srcDir: join(
					repoDir,
					'BWContest',
					teamData.contestId.toString(),
					teamData.teamId.toString()
				),
				outputCallback: (data) => {
					outputBuffer.push(data);
					this.webviewPostMessage({ msg: 'onRunningOutput', data: outputBuffer.join('') });
				}
			});
			if (res.success === true) {
				killFunc = res.killFunc;
				res.runResult.then(() => {
					this.runningProgram = undefined;
					this.webviewPostMessage({ msg: 'onRunningDone' });
				});
			} else {
				this.runningProgram = undefined;
				this.webviewPostMessage({
					msg: 'onRunningOutput',
					data: `${res.runResult.kind}:\n${res.runResult.output}`
				});
				this.webviewPostMessage({ msg: 'onRunningDone' });
			}
		}
		if (killFunc !== undefined) {
			this.runningProgram = {
				problemId: problemId,
				outputBuffer: outputBuffer,
				kill: killFunc
			};
		} else {
			this.webviewPostMessage({ msg: 'onRunningDone' });
		}
	}

	private async handleRequestProblemData() {
		const token: string | undefined = this.context.globalState.get('token');
		if (token !== undefined) {
			const res = await fetch(urlJoin(this.webUrl, `/api/contest/${token}`));
			const data = await res.json();
			if (data.success === true) {
				this.problemData = data.problems;
				this.webviewPostMessage({
					msg: 'onProblemData',
					data: data.problems
				});
			}
		}
	}

	private async update() {
		const webview = this.panel.webview;

		this.panel.webview.html = this._getHtmlForWebview(webview);
		webview.onDidReceiveMessage((m: MessageType) => {
			switch (m.msg) {
				case 'onKill': {
					if (this.runningProgram !== undefined) {
						this.runningProgram.kill();
						return;
					}
					break;
				}
				case 'onSubmit': {
					this.handleSubmit(m.data.problemId);
					break;
				}
				case 'onRun': {
					this.handleRun(m.data.problemId, m.data.input);
					break;
				}
				case 'onRequestProblemData': {
					this.handleRequestProblemData();
					break;
				}
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out/compiled', 'problemPanel.js')
		);

		const stylesResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'reset.css')
		);
		const stylesMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode.css')
		);
		const cssUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out/compiled', 'problemPanel.css')
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <!--
                        Use a content security policy to only allow loading images from https or from our extension directory,
                        and only allow scripts that have a specific nonce.
                    -->
                    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="${stylesResetUri}" rel="stylesheet">
                    <link href="${stylesMainUri}" rel="stylesheet">
                    <link href="${cssUri}" rel="stylesheet">
					<script nonce="${nonce}">
                    	const vscode = acquireVsCodeApi();
                	</script>
                </head>
                <body>
                </body>
                <script src=${scriptUri} nonce="${nonce}">
                </script>
			</html>`;
	}
}
