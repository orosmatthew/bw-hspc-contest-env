# BW Contest Web

## Build Instructions

### For all builds

You must fill out a `.env` file. An example is provided in `.env.example`. This is used for dev, production, and docker.

Build dependencies:

- NodeJS
- Docker (for docker build)

### For Development

```bash
npm i
npm run dev
```

### For Production

```bash
npm i
npm run build
node build
```
