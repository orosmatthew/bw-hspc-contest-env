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

### Database

```bash
npx drizzle-kit push # for pushing ad-hoc changes for dev. Will also initialize db.
npx drizzle-kit migrate # for applying migrations. Will also initialize db.
npx drizzle-kit generate --name my_cool_migration # for creating migrations
```

### For Production

```bash
npm i
npm run build
node build
```
