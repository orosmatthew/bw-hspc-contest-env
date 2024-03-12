"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/tree-kill/index.js
var require_tree_kill = __commonJS({
  "node_modules/tree-kill/index.js"(exports2, module2) {
    "use strict";
    var childProcess = require("child_process");
    var spawn2 = childProcess.spawn;
    var exec2 = childProcess.exec;
    module2.exports = function(pid, signal, callback) {
      if (typeof signal === "function" && callback === void 0) {
        callback = signal;
        signal = void 0;
      }
      pid = parseInt(pid);
      if (Number.isNaN(pid)) {
        if (callback) {
          return callback(new Error("pid must be a number"));
        } else {
          throw new Error("pid must be a number");
        }
      }
      var tree = {};
      var pidsToProcess = {};
      tree[pid] = [];
      pidsToProcess[pid] = 1;
      switch (process.platform) {
        case "win32":
          exec2("taskkill /pid " + pid + " /T /F", callback);
          break;
        case "darwin":
          buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
            return spawn2("pgrep", ["-P", parentPid]);
          }, function() {
            killAll(tree, signal, callback);
          });
          break;
        default:
          buildProcessTree(pid, tree, pidsToProcess, function(parentPid) {
            return spawn2("ps", ["-o", "pid", "--no-headers", "--ppid", parentPid]);
          }, function() {
            killAll(tree, signal, callback);
          });
          break;
      }
    };
    function killAll(tree, signal, callback) {
      var killed = {};
      try {
        Object.keys(tree).forEach(function(pid) {
          tree[pid].forEach(function(pidpid) {
            if (!killed[pidpid]) {
              killPid(pidpid, signal);
              killed[pidpid] = 1;
            }
          });
          if (!killed[pid]) {
            killPid(pid, signal);
            killed[pid] = 1;
          }
        });
      } catch (err) {
        if (callback) {
          return callback(err);
        } else {
          throw err;
        }
      }
      if (callback) {
        return callback();
      }
    }
    function killPid(pid, signal) {
      try {
        process.kill(parseInt(pid, 10), signal);
      } catch (err) {
        if (err.code !== "ESRCH")
          throw err;
      }
    }
    function buildProcessTree(parentPid, tree, pidsToProcess, spawnChildProcessesList, cb) {
      var ps = spawnChildProcessesList(parentPid);
      var allData = "";
      ps.stdout.on("data", function(data) {
        var data = data.toString("ascii");
        allData += data;
      });
      var onClose = function(code) {
        delete pidsToProcess[parentPid];
        if (code != 0) {
          if (Object.keys(pidsToProcess).length == 0) {
            cb();
          }
          return;
        }
        allData.match(/\d+/g).forEach(function(pid) {
          pid = parseInt(pid, 10);
          tree[parentPid].push(pid);
          tree[pid] = [];
          pidsToProcess[pid] = 1;
          buildProcessTree(pid, tree, pidsToProcess, spawnChildProcessesList, cb);
        });
      };
      ps.on("close", onClose);
    }
  }
});

// submission-runner/java.cts
var java_exports = {};
__export(java_exports, {
  runJava: () => runJava
});
module.exports = __toCommonJS(java_exports);
var import_path = require("path");
var import_child_process = require("child_process");
var util = __toESM(require("util"));

// submission-runner/settings.cts
var timeoutSeconds = 30;

// submission-runner/java.cts
var kill = require_tree_kill();
var execPromise = util.promisify(import_child_process.exec);
var runJava = async function(params) {
  console.log(`- BUILD: ${params.mainFile}`);
  const compileCommand = `javac -cp ${(0, import_path.join)(params.srcDir, "src")} ${params.mainFile} -d ${(0, import_path.join)(params.srcDir, "build")}`;
  try {
    await execPromise(compileCommand);
  } catch (e) {
    const buildErrorText = e?.toString() ?? "Unknown build errors.";
    console.log("Build errors: " + buildErrorText);
    return {
      success: false,
      runResult: { kind: "CompileFailed", resultKindReason: buildErrorText }
    };
  }
  console.log(`- RUN: ${params.mainClass}`);
  const runCommand = `java -cp "${(0, import_path.join)(params.srcDir, "build")}" ${params.mainClass}`;
  try {
    let outputBuffer = "";
    const child = (0, import_child_process.spawn)(runCommand, { shell: true });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => {
      outputBuffer += data.toString();
      params.outputCallback?.(data.toString());
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => {
      outputBuffer += data.toString();
      params.outputCallback?.(data.toString());
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
              runtimeMilliseconds
            });
          } else {
            console.log(`Process terminated, total sandbox time: ${runtimeMilliseconds}ms`);
            resolve({
              kind: "TimeLimitExceeded",
              output: outputBuffer,
              resultKindReason: `Timeout after ${timeoutSeconds} seconds`
            });
          }
        });
        const timeoutHandle = setTimeout(() => {
          if (completedNormally) {
            return;
          }
          console.log(`Run timed out after ${timeoutSeconds} seconds, killing process...`);
          timeLimitExceeded = true;
          child.stdin.end();
          child.stdin.destroy();
          child.stdout.destroy();
          child.stderr.destroy();
          child.kill("SIGKILL");
        }, timeoutSeconds * 1e3);
      }),
      killFunc() {
        if (child.pid !== void 0) {
          if (!completedNormally && !timeLimitExceeded) {
            kill(child.pid);
            params.outputCallback?.("\n[Manually stopped]");
          }
        }
      }
    };
  } catch (error) {
    return { success: false, runResult: { kind: "RunError" } };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  runJava
});
