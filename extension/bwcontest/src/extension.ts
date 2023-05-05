import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "bwcontest" is now active!');

	let disposable = vscode.commands.registerCommand('bwcontest.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from BWContest!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
