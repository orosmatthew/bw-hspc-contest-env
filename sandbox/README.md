# BW Contest Sandbox

## Build Instructions

### For all builds

You must fill out a `.env` file. An example is provided in `.env.example`. This is used for dev, production, and docker.

Build dependencies:

- NodeJS
- Docker (for docker build)

It is recommended to test development changes in a docker container.

### For Development

```bash
npm i
npm run build
node build
```

### For Production

```bash
npm i
npm run build
node build
```

### Docker

```bash
docker compose up --build
```
