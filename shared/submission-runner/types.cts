import { z } from 'zod';

const RunResultKind = z.enum([
	'CompileFailed',
	'TimeLimitExceeded',
	'Completed',
	'RunError'
]);

export const SourceFileWithTextZod = z
	.object({
		pathFromProblemRoot: z.string(),
		content: z.string(),
	})
	.strict();

export type SourceFileWithText = z.infer<typeof SourceFileWithTextZod>;

export type RunResultKind = z.infer<typeof RunResultKind>;

export const RunResultZod = z
	.object({
		kind: RunResultKind,
		output: z.string().optional(),
		exitCode: z.number().optional(),
		runtimeMilliseconds: z.number().optional(),
		resultKindReason: z.string().optional(),
		sourceFiles: z.array(SourceFileWithTextZod).optional()
	})
	.strict();

export type RunResult = z.infer<typeof RunResultZod>;

export interface IRunnerParams {
	srcDir: string;
	studentCodeRootForProblem: string;
	input: string;
	outputCallback?: (data: string) => void;
}

export type IRunnerReturn =
	| { success: true; killFunc: () => void; runResult: Promise<RunResult> }
	| { success: false; runResult: RunResult };

export type IRunner<T extends IRunnerParams = IRunnerParams> = (
	params: T
) => Promise<IRunnerReturn>;
