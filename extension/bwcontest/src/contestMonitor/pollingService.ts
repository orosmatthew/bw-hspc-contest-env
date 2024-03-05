import * as vscode from 'vscode';
import outputPanelLog from '../outputPanelLog';
import { sleep } from '../utilities/sleep';
import { pollContestStatus } from './contestStateSyncManager';

let currentlyPolling = false;

const defaultPollingIntervalSeconds = 30;
const developerFastPollingIntervalSeconds = 5;

let pollingIntervalSeconds = defaultPollingIntervalSeconds;
export function useFastPolling(enabled: boolean): void {
	pollingIntervalSeconds = enabled ? developerFastPollingIntervalSeconds : defaultPollingIntervalSeconds;
	outputPanelLog.info(`Changed polling interval to ${pollingIntervalSeconds} seconds. Takes effect after current delay.`);
}

export async function startTeamStatusPolling(context: vscode.ExtensionContext) {
	if (currentlyPolling) {
		outputPanelLog.trace("  Tried to start team status polling, but it's already running.");
		return;
	}

	currentlyPolling = true;

	outputPanelLog.info(`Monitoring contest/team status every ${pollingIntervalSeconds} seconds`);
	while (currentlyPolling) {
		try {
			await pollContestStatus(context);
		}
		catch (error) {
			outputPanelLog.error("Polling contest status failed: " + (error ?? "<unknown error>"));
		}

		await sleep(pollingIntervalSeconds * 1000);
	}
}

export function stopTeamStatusPolling() {
	outputPanelLog.trace("Stopping team status polling");
    currentlyPolling = false;
}