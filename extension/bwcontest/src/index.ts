import * as vscode from 'vscode';
import { extensionService } from './services';

export function activate(context: vscode.ExtensionContext) {
	void extensionService.activate(context);
}

export function deactivate() {
	extensionService.deactivate();
}
