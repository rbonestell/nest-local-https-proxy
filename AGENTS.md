# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## What this is

`nest-local-https-proxy` is a small npm library that adds an HTTPS listener to an existing HTTP NestJS app (Express or Fastify) for **local development only**, using self-signed certs. Peer dependency: `@nestjs/common` 11 or 12. Node >= 22.

## Commands

```bash
npm run build          # tsc via tsconfig.build.json (lib/src only -> dist/), then again for .d.ts only
npm test               # jest (runInBand, detectOpenHandles, forceExit)
npm run test:cov       # same + coverage (text + cobertura -> ./coverage)
npm run lint           # eslint over lib/
npm run lint:fix
npx jest --config=jest.config.js -t "<test name pattern>"   # single test
```

Jest `rootDir` is `./lib` and it picks up `*.spec.ts`. The husky pre-commit hook runs `lint-staged`, which runs `eslint --fix` on staged `lib/**/*.ts`.

## Architecture

All library code lives in one file: `lib/src/local-https-proxy.ts`. Its tests are in `lib/test/local-https-proxy.spec.ts`.

- `LocalHttpsProxy` extends `EventEmitter`. The constructor checks that `httpsOptions` includes `cert` and `key`, then builds an `https.Server` whose request listener is taken **directly from the Nest app's HTTP adapter**. Nothing proxies over the network. The HTTPS server calls the same handler that the HTTP server uses.
- Adapter detection is in `getNestAppRequestListener`. It uses `adapter.getInstance().routing` for Fastify and falls back to `adapter.getInstance()` for Express. Any change to adapter support belongs here.
- Events: `listening` (port) and `error` (Error). The optional constructor callbacks are subscribed to these same events. `start()` on a proxy that is already listening emits `error` and does not throw.
- The public event typings come from merging the `ILocalHttpsProxy` declaration interface with the class.

Tests mock `https` with `jest.mock('https')` and replace the server with an `EventEmitter`. Every case runs through `describe.each` for both Express and Fastify adapters, so a new test covers both automatically.

## Example app

`example/` is a separate Nest app with its own `package.json`. It consumes the library via `"nest-local-https-proxy": "file:../"` and ships a sample self-signed cert. The proxy only starts when `APP_ENV=local`. `example/.npmrc` sets `install-links=true`, so the library is installed as a packed copy and not a symlink. A symlink would put two `@nestjs/common` copies in play and break types. After changing the library, run `npm run build` at the root and then `npm i` in `example/` to pick up the change.

## Style

Prettier: tabs, single quotes, `trailingComma: es5`. The root `tsconfig.json` has `strictNullChecks` and `noImplicitAny` turned off.

## CI / release

GitHub Actions: `build.yml` runs `npm run build` and `test.yml` runs `test:cov` on a Node 22 + 24 matrix; `test.yml` also uploads to Codecov. `publish.yml` runs `npm publish --provenance` when a GitHub release is published.

## Nest 12 / ESM

Nest 12 packages are ESM-only (`"type": "module"`), and jest's CJS loader can't import them. For that reason the devDeps stay on Nest 11 while the peer range allows 11 and 12. The library ships as CJS and imports `@nestjs/common` with `import type` only, so the emitted JS has no runtime dependency on Nest. Keep it that way.
