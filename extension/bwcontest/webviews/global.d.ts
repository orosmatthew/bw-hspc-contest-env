/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="svelte" />

type VSCode = {
	postMessage(message: any): void;
	getState(): any;
	setState(state: any): void;
};

declare const vscode: VSCode;
