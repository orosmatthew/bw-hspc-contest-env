import * as vscode from 'vscode';
import { BWPanel } from './BWPanel';
import { SidebarProvider } from './SidebarProvider';
import { notDeepEqual } from 'assert';
import * as child_process from 'child_process';
import * as fs from 'fs-extra';

interface BWContestSettings {
	repoBaseUrl: string;
	repoClonePath: string;
}

function closeAllWorkspaces() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders) {
		return;
	}
	const removedFolders = vscode.workspace.updateWorkspaceFolders(0, workspaceFolders.length);
	if (!removedFolders) {
		return;
	}
}

async function cloneAndOpenRepo(baseUrl: string, path: string, contestId: number, teamId: number) {
	const repoUrl = `${baseUrl}/${contestId.toString()}/${teamId.toString()}.git`;

	const repoName = repoUrl.split('/').pop()?.replace('.git', '')!;
	const clonedRepoPath = `${path}/${repoName}`;

	if (fs.existsSync(clonedRepoPath)) {
		const confirm = await vscode.window.showWarningMessage(
			'The repo already exists. Do you want to replace it?',
			'Delete and Replace',
			'Cancel'
		);
		if (confirm !== 'Delete and Replace') {
			return;
		}
		closeAllWorkspaces();
		fs.removeSync(clonedRepoPath);
	}

	child_process.exec(`git clone ${repoUrl}`, { cwd: path }, (error, stdout, stderr) => {
		if (error) {
			vscode.window.showErrorMessage(`BWContest: Failed to clone repo: ${error.message}`);
			return;
		}
	});

	const addedFolder = vscode.workspace.updateWorkspaceFolders(
		vscode.workspace.workspaceFolders?.length ?? 0,
		0,
		{ uri: vscode.Uri.file(clonedRepoPath), name: 'BWContest' }
	);

	if (!addedFolder) {
		vscode.window.showErrorMessage('BWContest: Failed to open cloned repo');
		return;
	}

	vscode.window.showInformationMessage('BWContest: Repo cloned and opened');
}

export function activate(context: vscode.ExtensionContext) {
	const sidebarProvider = new SidebarProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('bwcontest-sidebar', sidebarProvider)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('bwcontest.helloWorld', () => {
			const currentSettings = vscode.workspace
				.getConfiguration()
				.get<BWContestSettings>('BWContest');

			if (!currentSettings || currentSettings.repoBaseUrl == '') {
				vscode.window.showErrorMessage('BWContest: BWContest.repoBaseURL not set');
				return;
			}
			if (!currentSettings || currentSettings.repoClonePath == '') {
				vscode.window.showErrorMessage('BWContest: BWContest.repoClonePath not set');
				return;
			}
			cloneAndOpenRepo(currentSettings.repoBaseUrl, currentSettings.repoClonePath, 102, 1);
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
