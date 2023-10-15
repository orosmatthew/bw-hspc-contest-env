import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { runJava } from './run/java';
import { extensionSettings } from './extension';
import { join } from 'path';
import { submitProblem } from './submit';

export class BWPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: BWPanel | undefined;

	public static readonly viewType = 'bwpanel';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];
	private static _context?: vscode.ExtensionContext;
	private static _running: boolean;
	private static _kill: Function | null;

	public static createOrShow(context: vscode.ExtensionContext, webUrl: string) {
		this._context = context;
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (BWPanel.currentPanel) {
			BWPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			BWPanel.viewType,
			'BWContest',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				retainContextWhenHidden: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [
					vscode.Uri.joinPath(context.extensionUri, 'media'),
					vscode.Uri.joinPath(context.extensionUri, 'out/compiled')
				]
			}
		);

		BWPanel.currentPanel = new BWPanel(panel, context.extensionUri, webUrl);
	}

	public static kill() {
		BWPanel.currentPanel?.dispose();
		BWPanel.currentPanel = undefined;
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, webUrl: string) {
		BWPanel.currentPanel = new BWPanel(panel, extensionUri, webUrl);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, webUrl: string) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._update();
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public dispose() {
		BWPanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private async _update() {
		const webview = this._panel.webview;

		this._panel.webview.html = this._getHtmlForWebview(webview);
		webview.onDidReceiveMessage(async (data) => {
			switch (data.type) {
				case 'onKill': {
					if (!BWPanel._running || !BWPanel._kill) {
						break;
					}
					BWPanel._kill();
				}
				case 'onSubmit': {
					await vscode.workspace.saveAll();
					if (!data.value) {
						return;
					}
					const ans = await vscode.window.showInformationMessage(
						`Are you sure you want to submit ${data.value.problemName}?`,
						'Yes',
						'No'
					);
					if (ans !== 'Yes') {
						break;
					}
					try {
						await submitProblem(
							data.value.sessionToken,
							data.value.contestId,
							data.value.teamId,
							data.value.problemId
						);
					} catch (err: any) {
						vscode.window.showErrorMessage(err.message ?? 'Submission unsuccessful');
						break;
					}
					vscode.window.showInformationMessage('Submitted!');
					break;
				}
				case 'onRun': {
					if (BWPanel._running === true) {
						vscode.window.showErrorMessage('Already running');
						break;
					}
					await vscode.workspace.saveAll();
					if (!data.value) {
						break;
					}
					const repoDir = extensionSettings().repoClonePath;
					BWPanel._running = true;
					const process = await runJava(
						join(
							repoDir,
							'BWContest',
							data.value.contestId.toString(),
							data.value.teamId.toString(),
							data.value.problemPascalName.toString()
						),
						join(
							repoDir,
							'BWContest',
							data.value.contestId.toString(),
							data.value.teamId.toString(),
							data.value.problemPascalName.toString(),
							`${data.value.problemPascalName}.java`
						),
						data.value.problemPascalName,
						data.value.input
					);
					if (!process) {
						this._panel.webview.postMessage({
							type: 'onOutput',
							value: '[An error occurred while running]'
						});
						break;
					}
					process.output
						.then((output) => {
							this._panel.webview.postMessage({ type: 'onOutput', value: output });
							BWPanel._running = false;
							BWPanel._kill = null;
						})
						.catch(() => {
							this._panel.webview.postMessage({
								type: 'onOutput',
								value: '[An error occurred while running]'
							});
							BWPanel._running = false;
							BWPanel._kill = null;
						});
					BWPanel._kill = process.kill;
					break;
				}
				case 'onStartup': {
					const token: string | undefined = BWPanel._context?.globalState.get('token');

					if (token) {
						this._panel.webview.postMessage({
							type: 'onSession',
							value: token
						});
					}
					break;
				}
				case 'onInfo': {
					if (!data.value) {
						return;
					}
					vscode.window.showInformationMessage(data.value);
					break;
				}
				case 'onError': {
					if (!data.value) {
						return;
					}
					vscode.window.showErrorMessage(data.value);
					break;
				}
				// case "tokens": {
				//   await Util.globalState.update(accessTokenKey, data.accessToken);
				//   await Util.globalState.update(refreshTokenKey, data.refreshToken);
				//   break;
				// }
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// // And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'out/compiled', 'problemPanel.js')
		);

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
		);
		const stylesMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
		);
		const cssUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'out/compiled', 'problemPanel.css')
		);

		// // Use a nonce to only allow specific scripts to be run
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
