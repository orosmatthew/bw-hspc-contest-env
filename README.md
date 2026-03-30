# BW High School Programming Contest Environment

This is a mono-repo comprised of 4 components: `web`, `sandbox`, `extension`, and `shared`.

Each directory contains more detailed instructions for building, development, and deployment.

The entire codebase assumes a Linux environment.

## General Workflow after Cloning

### Extension

- After Clone
  - `cd shared`
    - `npm ci` - Install shared dependencies
    - `npm run build` - Build shared component
  - `cd extension/bwcontest`
    - `npm ci` - Install extension dependencies
    - `npm run build` - Build extension
- Development
  - `cd shared`
    - `npm run watch` - Watch for changes in shared component
  - `cd extension/bwcontest`
    - `npm run watch` - Watch for changes in extension
    - Press `F5` or run in VSCode to run extension
- Pre-Commit
  - `npm run pre-commit` - Format, lint, and check. Valid in all components.
- Deployment
  - `cd shared`
    - `npm run build` - Build shared component
  - `cd extension/bwcontest`
    - `npx vsce package` - Create `.vsix` extension file

### Sandbox

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
  - `npm run pre-commit` - Format, lint, and check. Valid in all components.
- Deployment
  - `cd sandbox`
    - `docker compose up --build` - Build and run docker container

### Shared

- After Clone
  - `cd shared`
    - `npm ci` - Install shared dependencies
    - `npm run build` - Build shared component
- Development
  - `cd shared`
    - `npm run watch` - Watch for changes in shared component
- Pre-Commit
  - `npm run pre-commit` - Format, lint, and check. Valid in all components.

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
    - `npm run dev` - Run development server for hot-reloading
- Pre-Commit
  - `npm run pre-commit` - Format, lint, and check. Valid in all components.
- Deployment
  - `cd web`
    - `docker compose up --build` - Build and run docker container
