import { RunResult } from '../index.ts';

interface IRunnerParams {
	srcDir: string;
	input: string;
	outputCallback?: (data: string) => void;
}

type IRunnerReturn = Promise<
	| { success: true; killFunc: () => void; runResult: Promise<RunResult> }
	| { success: false; runResult: RunResult }
>;

interface IRunner<T extends IRunnerParams = IRunnerParams> {
	(params: T): IRunnerReturn;
}
