import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { runJava } from './run/java';
import { extensionSettings } from './extension';
import { join } from 'path';

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

	public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
		this._context = context;
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (BWPanel.currentPanel) {
			BWPanel.currentPanel._panel.reveal(column);
			BWPanel.currentPanel._update();
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
					vscode.Uri.joinPath(extensionUri, 'media'),
					vscode.Uri.joinPath(extensionUri, 'out/compiled')
				]
			}
		);

		BWPanel.currentPanel = new BWPanel(panel, extensionUri);
	}

	public static kill() {
		BWPanel.currentPanel?.dispose();
		BWPanel.currentPanel = undefined;
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		BWPanel.currentPanel = new BWPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// // Handle messages from the webview
		// this._panel.webview.onDidReceiveMessage(
		//   (message) => {
		//     switch (message.command) {
		//       case "alert":
		//         vscode.window.showErrorMessage(message.text);
		//         return;
		//     }
		//   },
		//   null,
		//   this._disposables
		// );
	}

	public dispose() {
		BWPanel.currentPanel = undefined;

		// Clean up our resources
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
				case 'onRun': {
					if (!data.value) {
						return;
					}
					const repoDir = extensionSettings().repoClonePath;
					const output = await runJava(
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
					this._panel.webview.postMessage({ type: 'onOutput', value: output });
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