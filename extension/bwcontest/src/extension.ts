import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import outputPanelLog from './outputPanelLog';
import {
	startTeamStatusPollingOnActivation,
	stopTeamStatusPolling,
	useFastPolling
} from './contestMonitor/pollingService';
import {
	clearCachedRepoState,
	refreshRepoState,
	setRepoManagerExtensionContext
} from './teamRepoManager';
import { BWPanel } from './problemPanel';

export interface BWContestSettings {
	repoBaseUrl: string;
	webUrl: string;
	repoClonePath: string;
	javaPath: string;
	debugFastPolling: boolean;
}

export function extensionSettings(): BWContestSettings {
	return vscode.workspace.getConfiguration().get<BWContestSettings>('BWContest')!;
}

export function activate(context: vscode.ExtensionContext) {
	outputPanelLog.info('BWContest Extension Activated');

	const sidebarProvider = new SidebarProvider(
		context.extensionUri,
		context,
		extensionSettings().webUrl
	);

	let fastPolling = extensionSettings().debugFastPolling;
	useFastPolling(fastPolling);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('bwcontest-sidebar', sidebarProvider),
		vscode.commands.registerCommand('bwcontest.toggleFastPolling', () => {
			if (!extensionSettings().debugFastPolling) {
				outputPanelLog.trace('Tried to toggle fast polling, but not allowed.');
				return;
			}

			fastPolling = !fastPolling;
			useFastPolling(fastPolling);
		}),
		vscode.commands.registerCommand('bwcontest.showTestSubmitPage', () => {
			BWPanel.show(context, extensionSettings().webUrl);
		}),
		vscode.commands.registerCommand('bwcontest.refreshState', () => {
			refreshRepoState();
		})
	);

	startTeamStatusPollingOnActivation(context);

	setRepoManagerExtensionContext(context);
	refreshRepoState();

	vscode.workspace.onDidChangeWorkspaceFolders(() => {
		refreshRepoState();
	});
}

export function deactivate() {
	outputPanelLog.info('BWContest Extension Deactivated');
	stopTeamStatusPolling();
	clearCachedRepoState();
}
