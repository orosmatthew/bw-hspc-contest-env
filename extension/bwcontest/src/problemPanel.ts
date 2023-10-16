import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import urlJoin from 'url-join';

export type ProblemData = {
	id: number;
	name: string;
	pascalName: string;
	sampleInput: string;
	sampleOutput: string;
}[];

export type MessageType = { msg: 'onRequestProblemData' };
export type WebviewMessageType = { msg: 'onProblemData'; data: ProblemData };

/**
 * Singleton class for problem panel
 */
export class BWPanel {
	public static currentPanel: BWPanel | undefined;

	private running: boolean = false;
	// private kill: () => void | null = null;

	private constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly panel: vscode.WebviewPanel,
		private readonly extensionUri: vscode.Uri,
		private readonly webUrl: string
	) {
		this.update();
	}

	public static show(context: vscode.ExtensionContext, webUrl: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// Show panel if exists
		if (BWPanel.currentPanel) {
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
		this.panel.dispose();
		BWPanel.currentPanel = undefined;
	}

	private webviewPostMessage(m: WebviewMessageType) {
		this.panel.webview.postMessage(m);
	}

	private async update() {
		const webview = this.panel.webview;

		this.panel.webview.html = this._getHtmlForWebview(webview);
		webview.onDidReceiveMessage(async (m: MessageType) => {
			switch (m.msg) {
				// case 'onKill': {
				// 	if (!this.running || !this.kill) {
				// 		break;
				// 	}
				// 	this.kill();
				// }
				// case 'onSubmit': {
				// 	await vscode.workspace.saveAll();
				// 	if (!data.value) {
				// 		return;
				// 	}
				// 	const ans = await vscode.window.showInformationMessage(
				// 		`Are you sure you want to submit ${data.value.problemName}?`,
				// 		'Yes',
				// 		'No'
				// 	);
				// 	if (ans !== 'Yes') {
				// 		break;
				// 	}
				// 	try {
				// 		await submitProblem(
				// 			data.value.sessionToken,
				// 			data.value.contestId,
				// 			data.value.teamId,
				// 			data.value.problemId
				// 		);
				// 	} catch (err: any) {
				// 		vscode.window.showErrorMessage(err.message ?? 'Submission unsuccessful');
				// 		break;
				// 	}
				// 	vscode.window.showInformationMessage('Submitted!');
				// 	break;
				// }
				// case 'onRun': {
				// 	if (this.running === true) {
				// 		vscode.window.showErrorMessage('Already running');
				// 		break;
				// 	}
				// 	await vscode.workspace.saveAll();
				// 	if (!data.value) {
				// 		break;
				// 	}
				// 	const repoDir = extensionSettings().repoClonePath;
				// 	this.running = true;
				// 	const process = await runJava(
				// 		join(
				// 			repoDir,
				// 			'BWContest',
				// 			data.value.contestId.toString(),
				// 			data.value.teamId.toString(),
				// 			data.value.problemPascalName.toString()
				// 		),
				// 		join(
				// 			repoDir,
				// 			'BWContest',
				// 			data.value.contestId.toString(),
				// 			data.value.teamId.toString(),
				// 			data.value.problemPascalName.toString(),
				// 			`${data.value.problemPascalName}.java`
				// 		),
				// 		data.value.problemPascalName,
				// 		data.value.input
				// 	);
				// 	if (!process) {
				// 		this.panel.webview.postMessage({
				// 			type: 'onOutput',
				// 			value: '[An error occurred while running]'
				// 		});
				// 		break;
				// 	}
				// 	process.output
				// 		.then((output) => {
				// 			this.panel.webview.postMessage({ type: 'onOutput', value: output });
				// 			this.running = false;
				// 			this.kill = null;
				// 		})
				// 		.catch(() => {
				// 			this.panel.webview.postMessage({
				// 				type: 'onOutput',
				// 				value: '[An error occurred while running]'
				// 			});
				// 			this.running = false;
				// 			this.kill = null;
				// 		});
				// 	this.kill = process.kill;
				// 	break;
				// }
				case 'onRequestProblemData': {
					const token: string | undefined = this.context.globalState.get('token');
					if (token !== undefined) {
						const res = await fetch(urlJoin(this.webUrl, `/api/contest/${token}`));
						const data = await res.json();
						if (data.success === true) {
							this.webviewPostMessage({
								msg: 'onProblemData',
								data: data.problems
							});
						}
					}
					break;
				}
				// case 'onInfo': {
				// 	if (!data.value) {
				// 		return;
				// 	}
				// 	vscode.window.showInformationMessage(data.value);
				// 	break;
				// }
				// case 'onError': {
				// 	if (!data.value) {
				// 		return;
				// 	}
				// 	vscode.window.showErrorMessage(data.value);
				// 	break;
				// }
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
