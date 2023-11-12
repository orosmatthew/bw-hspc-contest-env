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

### Docker

Copy the example docker compose file

```bash
# pwd web/
cp docker/docker-compose.example.yml ./docker-compose.yml
```

Fill out `.env` file

```bash
cp .env.example .env
```

Run the container

```bash
docker compose up --build
```
