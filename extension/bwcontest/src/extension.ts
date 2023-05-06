import * as vscode from 'vscode';
import { BWPanel } from './BWPanel';
import { SidebarProvider } from './SidebarProvider';
import { notDeepEqual } from 'assert';

export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('bwcontest-sidebar', sidebarProvider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('bwcontest.helloWorld', () => {
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('bwcontest.askQuestion', async () => {
			const answer = await vscode.window.showInformationMessage('How was your day?', 'good', 'bad');
			if (answer === 'bad') {
				vscode.window.showInformationMessage('Sorry to hear that');
			} else {
				console.log(answer);
			}
		})
	);
}

export function deactivate() {}
