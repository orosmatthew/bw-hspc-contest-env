"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCpp = void 0;
const path_1 = require("path");
const child_process_1 = require("child_process");
const util = __importStar(require("util"));
const settings_cjs_1 = require("./settings.cjs");
const kill = __importStar(require("kill"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs-extra"));
const execPromise = util.promisify(child_process_1.exec);
const runCpp = function (params) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const tmpDir = os.tmpdir();
        const buildDir = (0, path_1.join)(tmpDir, "bwcontest-cpp");
        if (fs.existsSync(buildDir)) {
            fs.removeSync(buildDir);
        }
        fs.mkdirSync(buildDir);
        console.log(`- BUILD: ${params.problemName}`);
        const configureCommand = `cmake -S ${params.srcDir} -B ${buildDir}`;
        try {
            yield execPromise(configureCommand);
        }
        catch (e) {
            const buildErrorText = (_a = e === null || e === void 0 ? void 0 : e.toString()) !== null && _a !== void 0 ? _a : "Unknown build errors.";
            console.log("Build errors: " + buildErrorText);
            return {
                success: false,
                runResult: { kind: "CompileFailed", resultKindReason: buildErrorText },
            };
        }
        const compileCommand = `cmake --build ${buildDir} --target ${params.problemName}`;
        try {
            yield execPromise(compileCommand);
        }
        catch (e) {
            const buildErrorText = (_b = e === null || e === void 0 ? void 0 : e.toString()) !== null && _b !== void 0 ? _b : "Unknown build errors.";
            console.log("Build errors: " + buildErrorText);
            return {
                success: false,
                runResult: { kind: "CompileFailed", resultKindReason: buildErrorText },
            };
        }
        console.log(`- RUN: ${params.problemName}`);
        let runCommand = "";
        if (params.cppPlatform === "VisualStudio") {
            runCommand = `${(0, path_1.join)(buildDir, "Debug", `${params.problemName}.exe`)}`;
        }
        else {
            runCommand = `${(0, path_1.join)(buildDir, params.problemName)}`;
        }
        try {
            let outputBuffer = "";
            const child = (0, child_process_1.spawn)(runCommand, { shell: true });
            child.stdout.setEncoding("utf8");
            child.stdout.on("data", (data) => {
                outputBuffer += data.toString();
            });
            child.stderr.setEncoding("utf8");
            child.stderr.on("data", (data) => {
                outputBuffer += data.toString();
            });
            const runStartTime = performance.now();
            child.stdin.write(params.input);
            child.stdin.end();
            let timeLimitExceeded = false;
            let completedNormally = false;
            return {
                success: true,
                runResult: new Promise((resolve) => {
                    child.on("close", () => {
                        completedNormally = !timeLimitExceeded;
                        const runEndTime = performance.now();
                        const runtimeMilliseconds = Math.floor(runEndTime - runStartTime);
                        if (completedNormally) {
                            clearTimeout(timeoutHandle);
                            resolve({
                                kind: "Completed",
                                output: outputBuffer,
                                exitCode: child.exitCode,
                                runtimeMilliseconds,
                            });
                        }
                        else {
                            console.log(`Process terminated, total sandbox time: ${runtimeMilliseconds}ms`);
                            resolve({
                                kind: "TimeLimitExceeded",
                                output: outputBuffer,
                                resultKindReason: `Timeout after ${settings_cjs_1.timeoutSeconds} seconds`,
                            });
                        }
                    });
                    const timeoutHandle = setTimeout(() => {
                        if (completedNormally) {
                            return;
                        }
                        console.log(`Run timed out after ${settings_cjs_1.timeoutSeconds} seconds, killing process...`);
                        timeLimitExceeded = true;
                        child.stdin.end();
                        child.stdin.destroy();
                        child.stdout.destroy();
                        child.stderr.destroy();
                        child.kill("SIGKILL");
                    }, settings_cjs_1.timeoutSeconds * 1000);
                }),
                killFunc() {
                    var _a;
                    if (child.pid !== undefined) {
                        if (!completedNormally && !timeLimitExceeded) {
                            kill(child.pid);
                            (_a = params.outputCallback) === null || _a === void 0 ? void 0 : _a.call(params, "\n[Manually stopped]");
                        }
                    }
                },
            };
        }
        catch (error) {
            return { success: false, runResult: { kind: "RunError" } };
        }
    });
};
exports.runCpp = runCpp;
//# sourceMappingURL=cpp.cjs.map