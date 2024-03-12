'use strict';
var __awaiter =
	(this && this.__awaiter) ||
	function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
				? value
				: new P(function (resolve) {
						resolve(value);
					});
		}
		return new (P || (P = Promise))(function (resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator['throw'](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.runCSharp = void 0;
const child_process_1 = require('child_process');
const tree_kill_1 = __importDefault(require('tree-kill'));
const settings_cjs_1 = require('./settings.cjs');
const runCSharp = function (params) {
	return __awaiter(this, void 0, void 0, function* () {
		console.log(`- RUN: ${params.srcDir}`);
		const child = (0, child_process_1.spawn)('dotnet run', { shell: true, cwd: params.srcDir });
		try {
			let outputBuffer = '';
			child.stdout.setEncoding('utf8');
			child.stdout.on('data', (data) => {
				var _a;
				outputBuffer += data.toString();
				(_a = params.outputCallback) === null || _a === void 0
					? void 0
					: _a.call(params, data.toString());
			});
			child.stderr.setEncoding('utf8');
			child.stderr.on('data', (data) => {
				var _a;
				outputBuffer += data.toString();
				(_a = params.outputCallback) === null || _a === void 0
					? void 0
					: _a.call(params, data.toString());
			});
			const runStartTime = performance.now();
			child.stdin.write(params.input);
			child.stdin.end();
			let timeLimitExceeded = false;
			let completedNormally = false;
			return {
				success: true,
				runResult: new Promise((resolve) => {
					child.on('close', () => {
						completedNormally = !timeLimitExceeded;
						const runEndTime = performance.now();
						const runtimeMilliseconds = Math.floor(runEndTime - runStartTime);
						if (completedNormally) {
							clearTimeout(timeoutHandle);
							resolve({
								kind: 'Completed',
								output: outputBuffer,
								exitCode: child.exitCode,
								runtimeMilliseconds
							});
						} else {
							console.log(`Process terminated, total sandbox time: ${runtimeMilliseconds}ms`);
							resolve({
								kind: 'TimeLimitExceeded',
								output: outputBuffer,
								resultKindReason: `Timeout after ${settings_cjs_1.timeoutSeconds} seconds`
							});
						}
					});
					const timeoutHandle = setTimeout(() => {
						if (completedNormally) {
							return;
						}
						console.log(
							`Run timed out after ${settings_cjs_1.timeoutSeconds} seconds, killing process...`
						);
						timeLimitExceeded = true;
						child.stdin.end();
						child.stdin.destroy();
						child.stdout.destroy();
						child.stderr.destroy();
						if (child.pid !== undefined) {
							(0, tree_kill_1.default)(child.pid);
						}
					}, settings_cjs_1.timeoutSeconds * 1000);
				}),
				killFunc() {
					var _a;
					if (child.pid !== undefined) {
						if (!completedNormally && !timeLimitExceeded) {
							(0, tree_kill_1.default)(child.pid);
							(_a = params.outputCallback) === null || _a === void 0
								? void 0
								: _a.call(params, '\n[Manually stopped]');
						}
					}
				}
			};
		} catch (error) {
			return { success: false, runResult: { kind: 'RunError' } };
		}
	});
};
exports.runCSharp = runCSharp;
//# sourceMappingURL=csharp.cjs.map
