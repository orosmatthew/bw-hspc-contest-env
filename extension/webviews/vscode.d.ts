export type VSCode = {
	postMessage(message: unknown): void;
	getState(): unknown;
	setState(state: unknown): void;
};
