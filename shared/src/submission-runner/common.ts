import { z } from 'zod';

const runResultKindSchema = z.enum(['CompileFailed', 'TimeLimitExceeded', 'Completed', 'RunError']);

export const sourceFileWithTextSchema = z
	.object({
		pathFromProblemRoot: z.string(),
		content: z.string()
	})
	.strict();

export type SourceFileWithText = z.infer<typeof sourceFileWithTextSchema>;

export type RunResultKind = z.infer<typeof runResultKindSchema>;

export const runResultSchema = z
	.object({
		kind: runResultKindSchema,
		output: z.string().optional(),
		exitCode: z.number().optional(),
		runtimeMilliseconds: z.number().optional(),
		resultKindReason: z.string().optional(),
		sourceFiles: z.array(sourceFileWithTextSchema).optional()
	})
	.strict();

export type RunResult = z.infer<typeof runResultSchema>;

export interface RunnerParams {
	srcDir: string;
	studentCodeRootForProblem: string;
	input: string;
	outputCallback?: (data: string) => void;
}

export type RunnerResult =
	| { success: true; killFunc: () => void; runResult: Promise<RunResult> }
	| { success: false; runResult: RunResult };

export type Runner<T extends RunnerParams = RunnerParams> = (params: T) => Promise<RunnerResult>;

export function formatExecError(e: unknown): string {
	if (e instanceof Error) {
		const execError = e as Error & { stderr?: string; stdout?: string };
		const detail = execError.stderr?.trim() ?? execError.stdout?.trim();
		return detail ?? execError.message ?? 'Unknown error.';
	}
	return String(e) || 'Unknown error.';
}
