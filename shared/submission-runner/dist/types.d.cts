import { z } from 'zod';
declare const RunResultKind: z.ZodEnum<["CompileFailed", "TimeLimitExceeded", "Completed", "SandboxError", "RunError"]>;
export type RunResultKind = z.infer<typeof RunResultKind>;
export declare const RunResultZod: z.ZodObject<{
    kind: z.ZodEnum<["CompileFailed", "TimeLimitExceeded", "Completed", "SandboxError", "RunError"]>;
    output: z.ZodOptional<z.ZodString>;
    exitCode: z.ZodOptional<z.ZodNumber>;
    runtimeMilliseconds: z.ZodOptional<z.ZodNumber>;
    resultKindReason: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    kind: "CompileFailed" | "TimeLimitExceeded" | "Completed" | "SandboxError" | "RunError";
    output?: string | undefined;
    exitCode?: number | undefined;
    runtimeMilliseconds?: number | undefined;
    resultKindReason?: string | undefined;
}, {
    kind: "CompileFailed" | "TimeLimitExceeded" | "Completed" | "SandboxError" | "RunError";
    output?: string | undefined;
    exitCode?: number | undefined;
    runtimeMilliseconds?: number | undefined;
    resultKindReason?: string | undefined;
}>;
export type RunResult = z.infer<typeof RunResultZod>;
export interface IRunnerParams {
    srcDir: string;
    input: string;
    outputCallback?: (data: string) => void;
}
export type IRunnerReturn = {
    success: true;
    killFunc: () => void;
    runResult: Promise<RunResult>;
} | {
    success: false;
    runResult: RunResult;
};
export type IRunner<T extends IRunnerParams = IRunnerParams> = (params: T) => Promise<IRunnerReturn>;
export {};
//# sourceMappingURL=types.d.cts.map