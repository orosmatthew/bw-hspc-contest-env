export const timeoutSeconds = 30;

export type RunResultKind =
	| 'CompileFailed'
	| 'TimeLimitExceeded'
	| 'Completed'
	| 'SandboxError'
	| 'RunError';

export type RunResult = {
	kind: RunResultKind;
	output?: string;
	exitCode?: number;
	runtimeMilliseconds?: number;
	resultKindReason?: string;
};

export interface IRunnerParams {
	srcDir: string;
	input: string;
	outputCallback?: (data: string) => void;
}

export type IRunnerReturn = Promise<
	| { success: true; killFunc: () => void; runResult: Promise<RunResult> }
	| { success: false; runResult: RunResult }
>;

export interface IRunner<T extends IRunnerParams = IRunnerParams> {
	(params: T): IRunnerReturn;
}
