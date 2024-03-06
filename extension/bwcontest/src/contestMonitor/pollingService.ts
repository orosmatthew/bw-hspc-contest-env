import * as vscode from 'vscode';
import outputPanelLog from '../outputPanelLog';
import { sleep } from '../utilities/sleep';
import { pollContestStatus } from './contestStateSyncManager';
import { SimpleCancellationToken } from '../utilities/SimpleCancellationToken';

let extensionContext: vscode.ExtensionContext;

let currentlyPolling = false;
let currentPollingCancellationToken: SimpleCancellationToken | null = null;
let debugPollingLoopNum = 0;

const defaultPollingIntervalSeconds = 30;
const developerFastPollingIntervalSeconds = 5;
let pollingIntervalSeconds = defaultPollingIntervalSeconds;

export async function startTeamStatusPollingOnActivation(context: vscode.ExtensionContext) {
	extensionContext = context;

	outputPanelLog.info(`Extension activated, try starting polling loop`);
	await startTeamStatusPolling();
}

export async function startTeamStatusPolling() {
	if (currentlyPolling) {
		outputPanelLog.trace("Tried to start team status polling, but it's already running.");
		return;
	} else if (!extensionContext.globalState.get('token')) {
		outputPanelLog.info('Tried to start team status polling, but team is not logged in.');
		return;
	}

	currentlyPolling = true;
	currentPollingCancellationToken = new SimpleCancellationToken();
	startPollingWorker(currentPollingCancellationToken);
}

async function startPollingWorker(cancellationToken: SimpleCancellationToken) {
	const pollingLoopNum = ++debugPollingLoopNum;
	outputPanelLog.trace(
		`Starting polling loop #${pollingLoopNum}, checking contest/team status every ${pollingIntervalSeconds} seconds`
	);

	while (!cancellationToken.isCancelled) {
		try {
			await pollContestStatus(extensionContext);
		} catch (error) {
			outputPanelLog.error('Polling contest status failed: ' + (error ?? '<unknown error>'));
		}

		await sleep(pollingIntervalSeconds * 1000);
	}

	outputPanelLog.trace(`Polling loop #${pollingLoopNum} halting, cancellationToken was cancelled`);
}

export function stopTeamStatusPolling() {
	outputPanelLog.trace('Stopping team status polling');
	currentPollingCancellationToken?.cancel();
	currentlyPolling = false;
}

export function useFastPolling(enabled: boolean): void {
	pollingIntervalSeconds = enabled
		? developerFastPollingIntervalSeconds
		: defaultPollingIntervalSeconds;
	outputPanelLog.info(
		`Changed polling interval to ${pollingIntervalSeconds} seconds. Takes effect after current delay.`
	);
}
