import z from 'zod';
import * as vscode from 'vscode';
import { SidebarProvider } from '../SidebarProvider';
import {
	startTeamStatusPollingOnActivation,
	stopTeamStatusPolling,
	useFastPolling
} from '../contestMonitor/pollingService';
import {
	clearCachedRepoState,
	refreshRepoState,
	setRepoManagerExtensionContext
} from '../teamRepoManager';
import { outputPanelLog } from '../common/output-panel-log';
import { ProblemPanelProvider } from '../providers/problem-panel-provider';

export const bwContestSettingsSchema = z.object({
	repoBaseUrl: z.string(),
	webUrl: z.string(),
	repoClonePath: z.string(),
	javaPath: z.string(),
	debugFastPolling: z.boolean()
});
export type BwContestSettings = z.infer<typeof bwContestSettingsSchema>;

export class ExtensionService {
	getSettings(): BwContestSettings {
		const config = vscode.workspace.getConfiguration('BWContest');
		const rawSettings = {
			repoBaseUrl: config.get('repoBaseUrl'),
			webUrl: config.get('webUrl'),
			repoClonePath: config.get('repoClonePath'),
			javaPath: config.get('javaPath'),
			debugFastPolling: config.get('debugFastPolling')
		};
		const settingsParse = bwContestSettingsSchema.safeParse(rawSettings);
		if (settingsParse.success !== true) {
			throw new Error(`Invalid settings: ${settingsParse.error.message}`);
		}
		return settingsParse.data;
	}

	async activate(context: vscode.ExtensionContext) {
		outputPanelLog.info('BWContest Extension Activated');

		let settings: BwContestSettings;
		try {
			settings = this.getSettings();
		} catch (e) {
			outputPanelLog.error(String(e));
			vscode.window.showErrorMessage('BWContest Activation Failed, Invalid settings');
			return;
		}

		const sidebarProvider = new SidebarProvider(context.extensionUri, context, settings.webUrl);

		let fastPolling = settings.debugFastPolling;
		useFastPolling(fastPolling);

		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider('bwcontest-sidebar', sidebarProvider),
			vscode.commands.registerCommand('bwcontest.toggleFastPolling', () => {
				if (this.getSettings().debugFastPolling) {
					outputPanelLog.trace('Tried to toggle fast polling, but now allowed');
					vscode.window.showWarningMessage('Fast polling is forced on in settings.');
					return;
				}
				fastPolling = !fastPolling;
				useFastPolling(fastPolling);
				outputPanelLog.info(`Fast polling toggled to: ${fastPolling}`);
			}),
			vscode.commands.registerCommand('bwcontest.showTestSubmitPage', () => {
				ProblemPanelProvider.show(context, this.getSettings().webUrl);
			}),
			vscode.commands.registerCommand('bwcontest.refreshState', async () => {
				await refreshRepoState();
			}),
			vscode.workspace.onDidChangeWorkspaceFolders(async () => {
				outputPanelLog.info('Workspace folders changed, refreshing repo state');
				await refreshRepoState();
			})
		);

		await startTeamStatusPollingOnActivation(context);
		setRepoManagerExtensionContext(context);
		await refreshRepoState();
	}

	deactivate() {
		outputPanelLog.info('BWContest Extension Deactivated');
        ProblemPanelProvider.kill();
		stopTeamStatusPolling();
		clearCachedRepoState();
	}
}
