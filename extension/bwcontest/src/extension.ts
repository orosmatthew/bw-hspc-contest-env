import * as vscode from 'vscode';
import { SidebarProvider } from './SidebarProvider';
import * as fs from 'fs-extra';
import urlJoin from 'url-join';
import git from 'isomorphic-git';
import path = require('path');
import http from 'isomorphic-git/http/node';

export interface BWContestSettings {
	repoBaseUrl: string;
	webUrl: string;
	repoClonePath: string;
	javaPath: string;
}

export function extensionSettings(): BWContestSettings {
	return vscode.workspace.getConfiguration().get<BWContestSettings>('BWContest')!;
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

export async function cloneAndOpenRepo(contestId: number, teamId: number) {
	const currentSettings = vscode.workspace.getConfiguration().get<BWContestSettings>('BWContest');

	if (!currentSettings || currentSettings.repoBaseUrl == '') {
		vscode.window.showErrorMessage('BWContest: BWContest.repoBaseURL not set');
		return;
	}
	if (!currentSettings || currentSettings.repoClonePath == '') {
		vscode.window.showErrorMessage('BWContest: BWContest.repoClonePath not set');
		return;
	}
	if (!currentSettings || currentSettings.webUrl == '') {
		vscode.window.showErrorMessage('BWContest: BWContest.webUrl not set');
		return;
	}

	const repoUrl = urlJoin(
		currentSettings.repoBaseUrl,
		contestId.toString(),
		`${teamId.toString()}.git`
	);

	const repoName = teamId.toString();

	if (!fs.existsSync(`${currentSettings.repoClonePath}/BWContest`)) {
		fs.mkdirSync(`${currentSettings.repoClonePath}/BWContest`);
	}
	if (!fs.existsSync(`${currentSettings.repoClonePath}/BWContest/${contestId.toString()}`)) {
		fs.mkdirSync(`${currentSettings.repoClonePath}/BWContest/${contestId.toString()}`);
	}

	const clonedRepoPath = `${
		currentSettings.repoClonePath
	}/BWContest/${contestId.toString()}/${repoName}`;

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

	const dir = path.join(currentSettings.repoClonePath, 'BWContest', contestId.toString(), repoName);
	await git.clone({ fs, http, dir, url: repoUrl });

	closeAllWorkspaces();

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
	const sidebarProvider = new SidebarProvider(
		context.extensionUri,
		context,
		extensionSettings().webUrl
	);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('bwcontest-sidebar', sidebarProvider)
	);
}

export function deactivate() {}
