export const templateJavaProblem = `public class %%pascalName%% {
    public static void main(String[] args) {
        System.out.println("Hello %%pascalName%%!");
    }
}`;

export const templateCSharpGitIgnore = `*.sln
**/bin
**/obj`;

export const templateCSharpProblem = `public class %%pascalName%%
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hello %%pascalName%%!");
    }
}`;

export const templateCSharpProblemProj = `<Project Sdk="Microsoft.NET.Sdk">

<PropertyGroup>
  <OutputType>Exe</OutputType>
  <TargetFramework>net8.0</TargetFramework>
  <ImplicitUsings>enable</ImplicitUsings>
  <Nullable>enable</Nullable>
</PropertyGroup>

</Project>`;

export const templateCppCMakeLists = `cmake_minimum_required(VERSION 3.5)

project(bwcontest)

`;

export const templateCppProblem = `#include <bits/stdc++.h>

// using namespace std;

int main()
{
    std::cout << "Hello %%pascalName%%!" << std::endl;
    return 0;
}`;

export const templateCppGitIgnore = `/**/build
`;

export const templateCppVscodeLaunch = `{
    "configurations": [
        {
            "name": "C/C++: g++ build and debug active file",
            "type": "cppdbg",
            "request": "launch",
            "program": "\${fileDirname}/build/\${fileBasenameNoExtension}.out",
            "args": [],
            "stopAtEntry": false,
            "cwd": "\${fileDirname}",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "setupCommands": [
                {
                    "description": "Enable pretty-printing for gdb",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                },
                {
                    "description": "Set Disassembly Flavor to Intel",
                    "text": "-gdb-set disassembly-flavor intel",
                    "ignoreFailures": true
                }
            ],
            "preLaunchTask": "C/C++: g++ build active file",
            "miDebuggerPath": "/usr/bin/gdb"
        }
    ],
    "version": "2.0.0"
}
`;
export const templateCppVscodeTasks = `{
    "tasks": [
        {
            "type": "cppbuild",
            "label": "C/C++: g++ build active file",
            "command": "/usr/bin/g++",
            "args": [
                "-fdiagnostics-color=always",
                "-g",
                "\${file}",
                "-o",
                "\${fileDirname}/build/\${fileBasenameNoExtension}.out"
            ],
            "options": {
                "cwd": "\${fileDirname}"
            },
            "problemMatcher": [
                "$gcc"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "detail": "Task generated by Debugger."
        }
    ],
    "version": "2.0.0"
}
`;

export const templatePythonProblem = `print("Hello %%pascalName%%!")`;
