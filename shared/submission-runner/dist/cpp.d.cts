import type { IRunner, IRunnerParams } from "./types.cjs";
export type CppPlatform = "VisualStudio" | "GCC";
interface IRunnerParamsCpp extends IRunnerParams {
    srcDir: string;
    problemName: string;
    input: string;
    cppPlatform: CppPlatform;
    outputCallback?: (data: string) => void;
}
export declare const runCpp: IRunner<IRunnerParamsCpp>;
export {};
//# sourceMappingURL=cpp.d.cts.map