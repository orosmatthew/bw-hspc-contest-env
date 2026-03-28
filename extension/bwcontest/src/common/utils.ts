import * as vscode from 'vscode';
import * as crypto from 'crypto';

export function getNonce(): string {
	return crypto.randomBytes(16).toString('hex');
}

export function createHtmlForWebview(params: {
	webview: vscode.Webview;
	extensionUri: vscode.Uri;
	entryName: string;
}): string {
	const scriptUri = params.webview.asWebviewUri(
		vscode.Uri.joinPath(params.extensionUri, 'dist/webviews', `${params.entryName}.js`)
	);
	const cssUri = params.webview.asWebviewUri(
		vscode.Uri.joinPath(params.extensionUri, 'dist/webviews', `${params.entryName}.css`)
	);
	const stylesResetUri = params.webview.asWebviewUri(
		vscode.Uri.joinPath(params.extensionUri, 'media', 'reset.css')
	);
	const stylesMainUri = params.webview.asWebviewUri(
		vscode.Uri.joinPath(params.extensionUri, 'media', 'vscode.css')
	);

	const nonce = getNonce();

	return `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${params.webview.cspSource}; script-src 'nonce-${nonce}';">
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
                <script src="${scriptUri}" nonce="${nonce}">
                </script>
            </html>`;
}
