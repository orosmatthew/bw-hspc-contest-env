import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import urlJoin from 'url-join';
import git from 'isomorphic-git';
import path = require('path');
import http from 'isomorphic-git/http/node';
import outputPanelLog from './outputPanelLog';
import { BWContestSettings } from './extension';
import { LiteEvent } from './utilities/LiteEvent';
import { TeamData } from './sharedTypes';

let latestRepoState: RepoState = 'No Team';

const onRepoStateChanged = new LiteEvent<RepoChangedEventArgs>();
export const repoStateChanged = onRepoStateChanged.expose();

export type RepoState = 'No Team' | 'No Repo' | 'Repo Exists, Not Open' | 'Repo Open';

export type RepoChangedEventArgs = {
	state: RepoState;
};

export function getCachedRepoState(): RepoState {
	return latestRepoState;
}

export function clearCachedRepoState(): void {
	outputPanelLog.trace(`Clearing cached repoState`);
	setRepoState('No Team');
}

export async function refreshRepoState(): Promise<void> {
	outputPanelLog.trace(`Refreshing repoState`);

	if (!repoManagerExtensionContext) {
		return setRepoState('No Team');
	}

	const teamData = repoManagerExtensionContext.globalState.get<TeamData>('teamData');
	if (teamData === undefined) {
		return setRepoState('No Team');
	}

	const repoPaths = getRepoPaths(teamData.contestId, teamData.teamId);
	if (!repoPaths.success) {
		return setRepoState('No Team');
	}

	const { clonedRepoPath } = repoPaths;

	if (!fs.existsSync(clonedRepoPath)) {
		return setRepoState('No Repo');
	}

	if (!(await directoryHasGitRepo(clonedRepoPath))) {
		return setRepoState('No Repo');
	}

	if (vscode.workspace.workspaceFolders) {
		const existingOpenFolderForRepo = vscode.workspace.workspaceFolders.filter(
			(f) => f.uri.path === clonedRepoPath
		)[0];
		if (existingOpenFolderForRepo) {
			return setRepoState('Repo Open');
		}
	}

	return setRepoState('Repo Exists, Not Open');
}

function setRepoState(state: RepoState): void {
	if (state != latestRepoState) {
		outputPanelLog.trace(`Detected repoState change: ${latestRepoState} -> ${state}`);
		latestRepoState = state;
		onRepoStateChanged.trigger({ state });
	} else {
		outputPanelLog.trace(`No repoState change, same value: ${state}`);
	}
}

export async function cloneOpenRepo(contestId: number, teamId: number): Promise<boolean> {
	const result = (await cloneRepoWorker(contestId, teamId)) && openRepoWorker(contestId, teamId);
	refreshRepoState();
	return result;
}

export async function cloneRepo(contestId: number, teamId: number): Promise<boolean> {
	const result = await cloneRepoWorker(contestId, teamId);
	refreshRepoState();
	return result;
}

export function openRepo(contestId: number, teamId: number): boolean {
	const result = openRepoWorker(contestId, teamId);
	refreshRepoState();
	return result;
}

async function cloneRepoWorker(contestId: number, teamId: number): Promise<boolean> {
	const repoPaths = getRepoPaths(contestId, teamId);
	if (!repoPaths.success) {
		vscode.window.showErrorMessage('BWContest: BWContestSettings not configured');
		return false;
	}

	const { repoUrl, clonedRepoPath } = repoPaths;

	outputPanelLog.trace(`Trying to cloneRepo`);
	outputPanelLog.trace(`  URL: ${repoUrl}`);
	outputPanelLog.trace(`  Local Directory: ${clonedRepoPath}`);

	if (!fs.existsSync(clonedRepoPath)) {
		outputPanelLog.trace('Local Directory does not exist, creating it');
		try {
			fs.mkdirSync(clonedRepoPath, { recursive: true });
		} catch (error) {
			vscode.window.showErrorMessage(
				`BWContest: Could not create directory '${clonedRepoPath}': ${error}`
			);
			return false;
		}

		outputPanelLog.trace('Local Directory created, starting clone');
		return await doClone(clonedRepoPath, repoUrl);
	}

	if (fs.readdirSync(clonedRepoPath).length == 0) {
		outputPanelLog.trace('Local Directory exists but is empty, starting clone');
		return await doClone(clonedRepoPath, repoUrl);
	}

	outputPanelLog.trace('Local Directory exists and is non-empty');

	const gitHasRemote = await directoryHasGitRepo(clonedRepoPath);

	const deleteAndReplacePrompt = gitHasRemote
		? 'The repository already exists, replacing it will delete local changes. Are you sure?'
		: 'The repository directory exists with no git repo, deleting it will delete local changes. Are you sure?';

	const confirm = await vscode.window.showWarningMessage(
		deleteAndReplacePrompt,
		'Delete and Replace',
		'Cancel'
	);

	if (confirm !== 'Delete and Replace') {
		return false;
	}

	outputPanelLog.trace(`Team has chosen to delete non-empty Local Directory`);

	try {
		const existingItemsInDir = fs.readdirSync(clonedRepoPath, {
			recursive: false,
			encoding: 'utf8'
		});
		
		outputPanelLog.trace(` Removing ${existingItemsInDir.length} items`);
		for (const existingItemInDir of existingItemsInDir) {
			const fullPath = path.join(clonedRepoPath, existingItemInDir)
			outputPanelLog.trace(`  Removing ${fullPath}`);
			fs.rmSync(fullPath, { recursive: true, force: true });
		}
	} catch (error) {
		vscode.window.showErrorMessage(
			`BWContest: Failed to delete contents of Local Directory '${clonedRepoPath}': ${error}`
		);
		return false;
	}

	try {
		const itemsInDirAfterDelete = fs.readdirSync(clonedRepoPath, {
			recursive: false,
			encoding: 'utf8'
		});

		outputPanelLog.trace(`Local Directory should now be empty, there are ${itemsInDirAfterDelete.length} item(s): ${itemsInDirAfterDelete.join(', ')}`);
		if (itemsInDirAfterDelete.length > 0) {
			vscode.window.showErrorMessage(
				`BWContest: Failed to delete contents of Local Directory`
			);
			return false;
		}
	} catch (error) {
		vscode.window.showErrorMessage(
			`BWContest: Failed to delete contents of Local Directory '${clonedRepoPath}': ${error}`
		);
		return false;
	}

	outputPanelLog.trace(`Local Directory is now empty, starting clone`);
	return await doClone(clonedRepoPath, repoUrl);
}

async function directoryHasGitRepo(path: string): Promise<boolean> {
	try {
		await git.listRemotes({ fs, dir: path });
		return true;
	} catch (error) {
		return false;
	}
}

async function doClone(targetDirectory: string, repoUrl: string): Promise<boolean> {
	outputPanelLog.trace(`Running 'git clone' from url ${repoUrl} to directory: ${targetDirectory}`);
	try {
		await git.clone({ fs, http, dir: targetDirectory, url: repoUrl });
	} catch (error) {
		vscode.window.showErrorMessage(`BWContest: Failed to git clone: ${error}`);
		return false;
	}

	vscode.window.showInformationMessage('BWContest: Repo cloned!');
	return true;
}

function openRepoWorker(contestId: number, teamId: number): boolean {
	const repoPaths = getRepoPaths(contestId, teamId);
	if (!repoPaths.success) {
		vscode.window.showErrorMessage('BWContest: BWContestSettings not configured');
		return false;
	}

	const { clonedRepoPath } = repoPaths;

	if (!fs.existsSync(clonedRepoPath)) {
		vscode.window.showErrorMessage('BWContest: Local repo not found, clone first.');
		return false;
	}

	if (vscode.workspace.workspaceFolders) {
		const existingOpenFolderForRepo = vscode.workspace.workspaceFolders.filter(
			(f) => f.uri.path === clonedRepoPath
		)[0];
		if (existingOpenFolderForRepo) {
			vscode.window.showInformationMessage('BWContest: Repo is already opened');
			return false;
		}
	}

	outputPanelLog.trace(`Opening local repo from '${clonedRepoPath}'`);
	const workspaceUpdateValid = vscode.workspace.updateWorkspaceFolders(
		0,
		vscode.workspace.workspaceFolders?.length ?? 0,
		{ uri: vscode.Uri.file(clonedRepoPath), name: 'BWContest' }
	);

	if (!workspaceUpdateValid) {
		vscode.window.showErrorMessage('BWContest: Request to open repository in VSCode failed');
		return false;
	}

	// Shouldn't happen, or if it does the IDE will restart shortly after
	vscode.window.showInformationMessage('BWContest: Team repository opened!');
	return true;
}

export function getRepoPaths(
	contestId: number,
	teamId: number
): { success: false } | { success: true; repoUrl: string; clonedRepoPath: string } {
	const currentSettings = vscode.workspace.getConfiguration().get<BWContestSettings>('BWContest');

	if (!currentSettings || currentSettings.repoBaseUrl == '') {
		// vscode.window.showErrorMessage('BWContest: BWContest.repoBaseURL not set');
		return { success: false };
	}
	if (!currentSettings || currentSettings.repoClonePath == '') {
		// vscode.window.showErrorMessage('BWContest: BWContest.repoClonePath not set');
		return { success: false };
	}
	if (!currentSettings || currentSettings.webUrl == '') {
		// vscode.window.showErrorMessage('BWContest: BWContest.webUrl not set');
		return { success: false };
	}

	return {
		success: true,
		repoUrl: urlJoin(currentSettings.repoBaseUrl, contestId.toString(), `${teamId.toString()}.git`),
		clonedRepoPath: path.join(
			currentSettings.repoClonePath,
			'BWContest',
			contestId.toString(),
			teamId.toString()
		)
	};
}

let repoManagerExtensionContext: vscode.ExtensionContext | null;
export function setRepoManagerExtensionContext(context: vscode.ExtensionContext) {
	repoManagerExtensionContext = context;
}
