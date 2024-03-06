export class SimpleCancellationToken {
	private _isCancelled: boolean = false;
	get isCancelled() {
		return this._isCancelled;
	}

	cancel(): void {
		this._isCancelled = true;
	}
}
