# BW Contest Web

## Build Instructions

### For all builds

You must fill out a `.env` file. An example is provided in `.env.example`. This is used for dev, production, and docker.

Build dependencies:

- NodeJS
- Docker (for docker build)

### For Development

```console
$ npm install
$ npm run dev
```

### For Production

```console
$ npm install
$ npm run build
$ node build
```

### Docker

```console
$ docker-compose up --build
```
