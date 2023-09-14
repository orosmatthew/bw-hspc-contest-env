# BW Contest VSCode extension

## Build Instructions

### For Development

```bash
npm i
npm run compile
npm run watch
```

You must be using VSCode, then press `F5` to debug the extension 

### For Production

```bash
npm i
npm run vscode:prepublish
npx vsce package
```

This should then create a `.vsix` file that can be installed to any VSCode editor.
