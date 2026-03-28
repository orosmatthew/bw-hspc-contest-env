import * as vscode from 'vscode';
import { TeamData } from '../types';

export class GlobalStateService {
	private _context: vscode.ExtensionContext | undefined;

	init(params: { context: vscode.ExtensionContext }) {
		this._context = params.context;
	}

	getToken(): string | undefined {
		return this._context?.globalState.get<string>('token');
	}

	async setToken(value: string | undefined): Promise<void> {
		await this._context?.globalState.update('token', value);
	}

	getTeamData(): TeamData | undefined {
		return this._context?.globalState.get<TeamData>('teamData');
	}

	async setTeamData(value: TeamData | undefined): Promise<void> {
		await this._context?.globalState.update('teamData', value);
	}
}
