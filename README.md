# BW High School Programming Contest Environment

This is a mono-repo comprised of 4 components: `web`, `sandbox`, `extension`, and `shared`.

Each directory contains more detailed instructions for building, development, and deployment.

## General Workflow after Cloning

### Extension

Instruction for Extension assume Windows environment

 - After Clone
   - `cd shared`
     - `npm ci` - Install shared dependencies
     - `npm run build` - Build shared component
   - `cd extension/bwcontest`
     - `npm ci` - Install extension dependencies
     - `npm run compile` - Build extension
 - Development
   - `cd shared`
     - `npm run watch` - Watch for changes in shared component
   - `cd extension/bwcontest`
     - `npm run watch` - Watch for changes in extension
     - Press `F5` or run in VSCode to run extension
 - Pre-Commit
   - `cd shared`
     - `npm run format && npm run lint && npm run check` - Format, lint, and check shared component
   - `cd extension/bwcontest`
     - `npm run format && npm run lint && npm run check` - Format, lint, and check extension
 - Deployment
   - `cd shared`
     - `npm run build` - Build shared component
   - `cd extension/bwcontest`
     - `npx vsce package` - Create `.vsix` extension file

### Sandbox

Instruction for Sandbox assume Unix environment

 - After Clone
   - `cd shared`
     - `npm ci` - Install shared dependencies
     - `npm run build` - Build shared component
   - `cd sandbox`
     - `npm ci` - Install sandbox dependencies
     - `npm run build` - Build sandbox
 - Development
   - `cd shared`
     - `npm run watch` - Watch for changes in shared component
   - `cd sandbox`
     - `npm run watch` - Watch for changes in extension
 - Pre-Commit
   - `cd shared`
     - `npm run format && npm run lint && npm run check` - Format, lint, and check shared component
   - `cd sandbox`
     - `npm run format && npm run lint && npm run check` - Format, lint, and check sandbox
 - Deployment
   - `cd sandbox`
     - `docker compose up --build` - Build and run docker container

### Shared

Instruction for Shared assumes either Unix or Windows environment

 - After Clone
   - `cd shared`
     - `npm ci` - Install shared dependencies
     - `npm run build` - Build shared component
 - Development
   - `cd shared`
     - `npm run watch` - Watch for changes in shared component
 - Pre-Commit
   - `cd shared`
     - `npm run format && npm run lint && npm run check` - Format, lint, and check shared component

### Web

Instructions for Web assume Unix environment

 - After Clone
   - `cd shared`
     - `npm ci` - Install shared dependencies
     - `npm run build` - Build shared component
   - `cd web`
     - `npm ci` - Install web dependencies
     - `npm run build` - Build web
 - Development
   - `cd shared`
     - `npm run watch` - Watch for changes in shared component
   - `cd web`
     - `npm run dev -- --host` - Run development server for hot-reloading and type-gen
 - Pre-Commit
   - `cd shared`
     - `npm run format && npm run lint && npm run check` - Format, lint, and check shared component
   - `cd web`
     - `npm run format && npm run lint && npm run check` - Format, lint, and check web component
 - Deployment
   - `cd web`
     - `docker compose up --build` - Build and run docker container
