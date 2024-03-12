'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.RunResultZod = void 0;
const zod_1 = require('zod');
const RunResultKind = zod_1.z.enum([
	'CompileFailed',
	'TimeLimitExceeded',
	'Completed',
	'SandboxError',
	'RunError'
]);
exports.RunResultZod = zod_1.z
	.object({
		kind: RunResultKind,
		output: zod_1.z.string().optional(),
		exitCode: zod_1.z.number().optional(),
		runtimeMilliseconds: zod_1.z.number().optional(),
		resultKindReason: zod_1.z.string().optional()
	})
	.strict();
//# sourceMappingURL=types.cjs.map
