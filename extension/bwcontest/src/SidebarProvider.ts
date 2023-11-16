import * as vscode from 'vscode';
import { getNonce } from './getNonce';
import { cloneAndOpenRepo } from './extension';
import { BWPanel } from './problemPanel';
import urlJoin from 'url-join';

export type ContestLanguage = 'Java' | 'CSharp';

export type TeamData = {
	teamId: number;
	contestId: number;
	language: ContestLanguage;
};

export type WebviewMessageType = { msg: 'onLogin'; data: TeamData } | { msg: 'onLogout' };

export type MessageType =
	| { msg: 'onTestAndSubmit' }
	| { msg: 'onStartup' }
	| { msg: 'onClone'; data: { contestId: number; teamId: number } }
	| { msg: 'onLogin'; data: { teamName: string; password: string } }
	| { msg: 'onLogout' };

export class SidebarProvider implements vscode.WebviewViewProvider {
	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly context: vscode.ExtensionContext,
		private readonly webUrl: string
	) {}

	private async handleLogin(
		teamName: string,
		password: string,
		webviewPostMessage: (m: WebviewMessageType) => void
	) {
		const res = await fetch(urlJoin(this.webUrl, '/api/team/login'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				teamname: teamName,
				password: password
			})
		});
		const resData = await res.json();
		if (res.status !== 200 || resData.success !== true) {
			vscode.window.showErrorMessage('BWContest: Invalid Login');
			return;
		}
		const sessionToken = resData.token;
		this.context.globalState.update('token', sessionToken);
		const teamRes = await fetch(urlJoin(this.webUrl, `api/team/${sessionToken}`), {
			method: 'GET'
		});
		const data2 = await teamRes.json();
		if (!data2.success) {
			return;
		}
		this.context.globalState.update('teamData', data2.data);
		webviewPostMessage({ msg: 'onLogin', data: data2.data });
	}

	private async handleLogout(webviewPostMessage: (m: WebviewMessageType) => void) {
		const sessionToken = this.context.globalState.get<string>('token');
		if (sessionToken === undefined) {
			webviewPostMessage({ msg: 'onLogout' });
		}
		const res = await fetch(urlJoin(this.webUrl, '/api/team/logout'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				token: sessionToken
			})
		});
		if (res.status !== 200) {
			return;
		}
		const data2 = await res.json();
		if (data2.success === true) {
			webviewPostMessage({ msg: 'onLogout' });
			this.context.globalState.update('token', undefined);
		}
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		const webview = webviewView.webview;
		webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};
		webview.html = this.getHtmlForWebview(webview);

		const webviewPostMessage = (m: WebviewMessageType) => {
			webview.postMessage(m);
		};

		webview.onDidReceiveMessage((m: MessageType) => {
			switch (m.msg) {
				case 'onTestAndSubmit': {
					if (this.context) {
						BWPanel.show(this.context, this.webUrl);
					}
					break;
				}
				case 'onStartup': {
					const token = this.context.globalState.get<string>('token');
					const teamData = this.context.globalState.get<TeamData>('teamData');
					if (token !== undefined && teamData !== undefined) {
						webviewPostMessage({
							msg: 'onLogin',
							data: teamData
						});
					}
					break;
				}
				case 'onClone': {
					cloneAndOpenRepo(m.data.contestId, m.data.teamId);
					break;
				}
				case 'onLogin': {
					this.handleLogin(m.data.teamName, m.data.password, webviewPostMessage);
					break;
				}
				case 'onLogout': {
					this.handleLogout(webviewPostMessage);
					break;
				}
			}
		});
	}

	private getHtmlForWebview(webview: vscode.Webview) {
		const styleResetUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'reset.css')
		);
		const styleVSCodeUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'media', 'vscode.css')
		);

		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out', 'compiled/sidebar.js')
		);
		const styleMainUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'out', 'compiled/sidebar.css')
		);

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
                -->
				<meta http-equiv="Content-Security-Policy" content=" img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
                <link href="${styleMainUri}" rel="stylesheet">
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                </script>
			</head>
            <body>
			</body>
            <script nonce="${nonce}" src="${scriptUri}"></script>
			</html>`;
	}
}
