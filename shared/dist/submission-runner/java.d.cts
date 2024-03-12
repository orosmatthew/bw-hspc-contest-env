import type { IRunner, IRunnerParams } from './types.cjs';
interface IRunnerParamsJava extends IRunnerParams {
	srcDir: string;
	mainFile: string;
	mainClass: string;
	input: string;
	outputCallback?: (data: string) => void;
}
export declare const runJava: IRunner<IRunnerParamsJava>;
export {};
//# sourceMappingURL=java.d.cts.map
