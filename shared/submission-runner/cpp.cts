import { join } from "path";
import { exec, spawn } from "child_process";
import * as util from "util";
import type {
  IRunner,
  IRunnerParams,
  IRunnerReturn,
  RunResult,
} from "./types.cjs";
import { timeoutSeconds } from "./settings.cjs";
import kill from "tree-kill";
import * as os from "os";
import * as fs from "fs-extra";

const execPromise = util.promisify(exec);

export type CppPlatform = "VisualStudio" | "GCC";

interface IRunnerParamsCpp extends IRunnerParams {
  srcDir: string;
  problemName: string;
  input: string;
  cppPlatform: CppPlatform;
  outputCallback?: (data: string) => void;
}

export const runCpp: IRunner<IRunnerParamsCpp> = async function (
  params: IRunnerParamsCpp
): Promise<IRunnerReturn> {
  const tmpDir = os.tmpdir();
  const buildDir = join(tmpDir, "bwcontest-cpp");
  if (fs.existsSync(buildDir)) {
    fs.removeSync(buildDir);
  }
  fs.mkdirSync(buildDir);

  console.log(`- BUILD: ${params.problemName}`);

  const configureCommand = `cmake -S ${params.srcDir} -B ${buildDir}`;
  try {
    await execPromise(configureCommand);
  } catch (e) {
    const buildErrorText = e?.toString() ?? "Unknown build errors.";
    console.log("Build errors: " + buildErrorText);
    return {
      success: false,
      runResult: { kind: "CompileFailed", resultKindReason: buildErrorText },
    };
  }

  const compileCommand = `cmake --build ${buildDir} --target ${params.problemName}`;
  try {
    await execPromise(compileCommand);
  } catch (e) {
    const buildErrorText = e?.toString() ?? "Unknown build errors.";
    console.log("Build errors: " + buildErrorText);
    return {
      success: false,
      runResult: { kind: "CompileFailed", resultKindReason: buildErrorText },
    };
  }

  console.log(`- RUN: ${params.problemName}`);

  let runCommand = "";
  if (params.cppPlatform === "VisualStudio") {
    runCommand = `${join(buildDir, "Debug", `${params.problemName}.exe`)}`;
  } else {
    runCommand = `${join(buildDir, params.problemName)}`;
  }
  try {
    let outputBuffer = "";
    const child = spawn(runCommand, { shell: true });
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
      runResult: new Promise<RunResult>((resolve) => {
        child.on("close", () => {
          completedNormally = !timeLimitExceeded;

          const runEndTime = performance.now();
          const runtimeMilliseconds = Math.floor(runEndTime - runStartTime);

          if (completedNormally) {
            clearTimeout(timeoutHandle);
            resolve({
              kind: "Completed",
              output: outputBuffer,
              exitCode: child.exitCode!,
              runtimeMilliseconds,
            });
          } else {
            console.log(
              `Process terminated, total sandbox time: ${runtimeMilliseconds}ms`
            );
            resolve({
              kind: "TimeLimitExceeded",
              output: outputBuffer,
              resultKindReason: `Timeout after ${timeoutSeconds} seconds`,
            });
          }
        });

        const timeoutHandle = setTimeout(() => {
          if (completedNormally) {
            return;
          }

          console.log(
            `Run timed out after ${timeoutSeconds} seconds, killing process...`
          );
          timeLimitExceeded = true;

          child.stdin.end();
          child.stdin.destroy();
          child.stdout.destroy();
          child.stderr.destroy();
          child.kill("SIGKILL");
        }, timeoutSeconds * 1000);
      }),
      killFunc() {
        if (child.pid !== undefined) {
          if (!completedNormally && !timeLimitExceeded) {
            kill(child.pid);
            params.outputCallback?.("\n[Manually stopped]");
          }
        }
      },
    };
  } catch (error) {
    return { success: false, runResult: { kind: "RunError" } };
  }
};
