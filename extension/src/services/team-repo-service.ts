import { extensionService, globalStateService } from '.';
import { LiteEvent } from '../common/lite-event';
import { outputPanelLog } from '../common/output-panel-log';
import * as vscode from 'vscode';
import { RepoState, Result } from '../common-types';
import urlJoin from 'url-join';
import path from 'path';
import * as fs from 'fs-extra';
import git from 'isomorphic-git';
import * as os from 'os';
import http from 'isomorphic-git/http/node';

export type OnRepoStateChangeData = { state: RepoState };

export class TeamRepoService {
	private _latestRepoState: RepoState = 'noTeam';
	private _onRepoStateChange = new LiteEvent<OnRepoStateChangeData>();

	public onRepoStateChange = this._onRepoStateChange.expose();

	public getCachedRepoState(): RepoState {
		return this._latestRepoState;
	}

	public clearCachedRepoState(): void {
		outputPanelLog.trace(`Clearing cached repoState`);
		this._setRepoState('noTeam');
	}

	public async cloneOpenRepo(params: { contestId: number; teamId: number }): Promise<boolean> {
		const result =
			(await this._cloneRepoWorker({ contestId: params.contestId, teamId: params.teamId })) &&
			this._openRepoWorker({ contestId: params.contestId, teamId: params.teamId });
		await this.refreshRepoState();
		return result;
	}

	public async cloneRepo(params: { contestId: number; teamId: number }): Promise<boolean> {
		const result = await this._cloneRepoWorker({
			contestId: params.contestId,
			teamId: params.teamId
		});
		await this.refreshRepoState();
		return result;
	}

	public async openRepo(params: { contestId: number; teamId: number }): Promise<boolean> {
		const result = this._openRepoWorker({ contestId: params.contestId, teamId: params.teamId });
		await this.refreshRepoState();
		return result;
	}

	public async refreshRepoState(): Promise<void> {
		outputPanelLog.trace(`Refreshing repoState`);
		const teamData = globalStateService.getTeamData();
		if (teamData === undefined) {
			outputPanelLog.trace(`  -> repoState is 'No Team' because no globalState for teamData`);
			this._setRepoState('noTeam');
			return;
		}
		const repoPaths = this._getRepoPaths({
			contestId: teamData.contest.id,
			teamId: teamData.team.id
		});
		if (!repoPaths.success) {
			outputPanelLog.trace(`  -> repoState is 'No Team' can't calculate repo paths`);
			this._setRepoState('noTeam');
			return;
		}
		const clonedRepoPath = repoPaths.data.clonedRepoPath;

		outputPanelLog.trace(`  -> inspecting local repoPath ${clonedRepoPath}`);
		if (!fs.existsSync(clonedRepoPath)) {
			outputPanelLog.trace(`  -> repoState is 'No Repo', the local repo path doesn't exist at all`);
			this._setRepoState('noRepo');
			return;
		}

		if (!(await this._directoryHasGitRepo(clonedRepoPath))) {
			outputPanelLog.trace(
				`  -> repoState is 'No Repo', the local repo path exists but does not have a git repo`
			);
			this._setRepoState('noRepo');
			return;
		}

		if (vscode.workspace.workspaceFolders) {
			const existingOpenFolderForRepo = vscode.workspace.workspaceFolders.some((f) => {
				const p =
					os.platform() === 'win32'
						? path.normalize(f.uri.path.slice(1))
						: path.normalize(f.uri.path);
				return p === path.normalize(clonedRepoPath);
			});
			if (existingOpenFolderForRepo) {
				outputPanelLog.trace(
					`  -> repoState is 'Repo Open', we found the repo path in VSCode's workspaceFolders`
				);
				this._setRepoState('repoOpen');
				return;
			}
		}

		const workspaceFoldersLogText = vscode.workspace.workspaceFolders
			? vscode.workspace.workspaceFolders.map((f) => f.uri).join(', ')
			: '(no workspaceFolders)';
		outputPanelLog.trace(
			`  -> repoState is 'Repo Exists, Not Open', did not find repoPath (${clonedRepoPath}) in VSCode's workspaceFolders (${workspaceFoldersLogText})`
		);
		this._setRepoState('repoExistsNotOpen');
	}

	private async _cloneRepoWorker(params: { contestId: number; teamId: number }): Promise<boolean> {
		const repoPaths = this._getRepoPaths({ contestId: params.contestId, teamId: params.teamId });
		if (!repoPaths.success) {
			vscode.window.showErrorMessage('BWContest: BWContestSettings not configured');
			return false;
		}

		const repoUrl = repoPaths.data.repoUrl;
		const clonedRepoPath = repoPaths.data.clonedRepoPath;

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
			return await this._doClone({ targetDirectory: clonedRepoPath, repoUrl });
		}

		if (fs.readdirSync(clonedRepoPath).length === 0) {
			outputPanelLog.trace('Local Directory exists but is empty, starting clone');
			return await this._doClone({ targetDirectory: clonedRepoPath, repoUrl });
		}

		outputPanelLog.trace('Local Directory exists and is non-empty');

		const gitHasRemote = await this._directoryHasGitRepo(clonedRepoPath);

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
				const fullPath = path.join(clonedRepoPath, existingItemInDir);
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

			outputPanelLog.trace(
				`Local Directory should now be empty, there are ${itemsInDirAfterDelete.length} item(s): ${itemsInDirAfterDelete.join(', ')}`
			);
			if (itemsInDirAfterDelete.length > 0) {
				vscode.window.showErrorMessage(`BWContest: Failed to delete contents of Local Directory`);
				return false;
			}
		} catch (error) {
			vscode.window.showErrorMessage(
				`BWContest: Failed to delete contents of Local Directory '${clonedRepoPath}': ${error}`
			);
			return false;
		}

		outputPanelLog.trace(`Local Directory is now empty, starting clone`);
		return await this._doClone({ targetDirectory: clonedRepoPath, repoUrl });
	}

	private async _doClone(params: { targetDirectory: string; repoUrl: string }): Promise<boolean> {
		outputPanelLog.trace(
			`Running 'git clone' from url ${params.repoUrl} to directory: ${params.targetDirectory}`
		);
		try {
			await git.clone({ fs, http, dir: params.targetDirectory, url: params.repoUrl, ref: 'master' });
		} catch (error) {
			vscode.window.showErrorMessage(`BWContest: Failed to git clone: ${error}`);
			return false;
		}

		vscode.window.showInformationMessage('BWContest: Repo cloned!');
		return true;
	}

	private _openRepoWorker(params: { contestId: number; teamId: number }): boolean {
		const repoPaths = this._getRepoPaths({ contestId: params.contestId, teamId: params.teamId });
		if (!repoPaths.success) {
			vscode.window.showErrorMessage('BWContest: BWContestSettings not configured');
			return false;
		}
		const clonedRepoPath = repoPaths.data.clonedRepoPath;
		if (!fs.existsSync(clonedRepoPath)) {
			vscode.window.showErrorMessage('BWContest: Local repo not found, clone first.');
			return false;
		}
		if (vscode.workspace.workspaceFolders) {
			const existingOpenFolderForRepo = vscode.workspace.workspaceFolders.some((f) => {
				const p =
					os.platform() === 'win32'
						? path.normalize(f.uri.path.slice(1))
						: path.normalize(f.uri.path);
				return p === path.normalize(clonedRepoPath);
			});
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

	private _getRepoPaths(params: {
		contestId: number;
		teamId: number;
	}): Result<{ repoUrl: string; clonedRepoPath: string }> {
		const settings = extensionService.getSettings();
		if (settings.repoBaseUrl === '') {
			return { success: false, message: 'repoBaseUrl is empty' };
		}
		if (settings.repoClonePath === '') {
			return { success: false, message: 'repoClonePath is empty' };
		}
		if (settings.webUrl === '') {
			return { success: false, message: 'webUrl is empty' };
		}
		return {
			success: true,
			data: {
				repoUrl: urlJoin(
					settings.repoBaseUrl,
					params.contestId.toString(),
					`${params.teamId.toString()}.git`
				),
				clonedRepoPath: path.join(
					settings.repoClonePath,
					'BWContest',
					params.contestId.toString(),
					params.teamId.toString()
				)
			}
		};
	}

	private async _directoryHasGitRepo(path: string): Promise<boolean> {
		try {
			await git.listRemotes({ fs, dir: path });
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	private _setRepoState(state: RepoState): void {
		if (state !== this._latestRepoState) {
			outputPanelLog.trace(`Detected repoState change: ${this._latestRepoState} -> ${state}`);
			this._latestRepoState = state;
			this._onRepoStateChange.trigger({ state });
		} else {
			outputPanelLog.trace(`No repoState change, same value: ${state}`);
		}
	}
}
