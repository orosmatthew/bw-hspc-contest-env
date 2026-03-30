import { outputPanelLog } from '../common/output-panel-log';
import { contestStateSyncService, globalStateService } from '.';
import { CancellationToken, sleep } from '../common/utils';

export class PollingService {
	private static _defaultPollingIntervalSeconds = 30;
	private static _developerFastPollingIntervalSeconds = 5;

	private _currentlyPolling = false;
	private _currentPollingCancellationToken: CancellationToken | undefined;
	private _debugPollingLoopNum = 0;
	private _pollingIntervalSeconds = PollingService._defaultPollingIntervalSeconds;

	public async startTeamStatusPollingOnActivation(): Promise<void> {
		outputPanelLog.info(`Extension activated, try starting polling loop`);
		await this.startTeamStatusPolling();
	}

	public async startTeamStatusPolling(): Promise<void> {
		if (this._currentlyPolling) {
			outputPanelLog.trace("Tried to start team status polling, but it's already running.");
			return;
		} else if (globalStateService.getToken() === undefined) {
			outputPanelLog.info('Tried to start team status polling, but team is not logged in.');
			return;
		}
		this._currentlyPolling = true;
		this._currentPollingCancellationToken = new CancellationToken();
		void this._startPollingWorker(this._currentPollingCancellationToken);
	}

	public stopTeamStatusPolling(): void {
		outputPanelLog.trace('Stopping team status polling');
		this._currentPollingCancellationToken?.cancel();
		this._currentlyPolling = false;
	}

	public useFastPolling(enabled: boolean): void {
		this._pollingIntervalSeconds = enabled
			? PollingService._developerFastPollingIntervalSeconds
			: PollingService._defaultPollingIntervalSeconds;
		outputPanelLog.info(
			`Changed polling interval to ${this._pollingIntervalSeconds} seconds. Takes effect after current delay.`
		);
	}

	private async _startPollingWorker(cancellationToken: CancellationToken): Promise<void> {
		const pollingLoopNum = ++this._debugPollingLoopNum;
		outputPanelLog.trace(
			`Starting polling loop #${pollingLoopNum}, checking contest/team status every ${this._pollingIntervalSeconds} seconds`
		);
		while (!cancellationToken.isCancelled()) {
			try {
				await contestStateSyncService.pollContestStatus();
			} catch (error) {
				outputPanelLog.error('Polling contest status failed: ' + (error ?? '<unknown error>'));
			}
			await sleep(this._pollingIntervalSeconds * 1000);
		}
		outputPanelLog.trace(
			`Polling loop #${pollingLoopNum} halting, cancellationToken was cancelled`
		);
	}
}
