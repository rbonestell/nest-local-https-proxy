# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## What this is

`nest-local-https-proxy` is a small npm library that adds an HTTPS listener to an existing HTTP NestJS app (Express or Fastify) for **local development only**, using self-signed certs. Peer dependency: `@nestjs/common` 11 or 12. Node >= 22.

## Commands

```bash
npm run build          # tsc via tsconfig.build.json (lib/src only -> dist/), then again for .d.ts only
npm test               # vitest run
npm run test:cov       # same + v8 coverage (text + cobertura -> ./coverage); fails below 100%
npm run lint           # eslint over lib/
npm run lint:fix
npx vitest run -t "<test name pattern>"   # single test
```

`vitest.config.mjs` picks up `lib/test/**/*.spec.ts` and requires 100% coverage of `lib/src`. Vitest 5 needs Node >= 22.12 for development, while the library's `engines` stays `>=22.0.0` for consumers. The husky pre-commit hook runs `lint-staged`, which runs `eslint --fix` on staged `lib/**/*.ts`.

## Architecture

All library code lives in one file: `lib/src/local-https-proxy.ts`. Its tests are in `lib/test/local-https-proxy.spec.ts`.

- `LocalHttpsProxy` extends `EventEmitter`. The constructor checks that `httpsOptions` includes `cert` and `key`, then builds an `https.Server` whose request listener is taken **directly from the Nest app's HTTP adapter**. Nothing proxies over the network. The HTTPS server calls the same handler that the HTTP server uses.
- Adapter detection is in `getNestAppRequestListener`. It uses `adapter.getInstance().routing` for Fastify and falls back to `adapter.getInstance()` for Express. Any change to adapter support belongs here.
- Events: `listening` (port) and `error` (Error). The optional constructor callbacks are subscribed to these same events. `start()` on a proxy that is already listening emits `error` and does not throw.
- The public event typings come from merging the `ILocalHttpsProxy` declaration interface with the class.

Tests mock `https` with `vi.mock('https')` and replace the server with an `EventEmitter`. Every case runs through `describe.each` for both Express and Fastify adapters, so a new test covers both automatically.

## Style

Prettier: tabs, single quotes, `trailingComma: es5`. The root `tsconfig.json` has `strictNullChecks` and `noImplicitAny` turned off.

## CI / release

GitHub Actions: `build.yml` runs `npm run build` and `test.yml` runs `test:cov`, both on a Node 22 + 24 matrix. `test.yml` also runs against Nest 11 and 12: it installs Nest 11 with `npm install --no-save` over the Nest 12 devDeps. It uploads to Codecov. `publish.yml` runs `npm publish --provenance` when a GitHub release is published.

## Nest 12 / ESM

Nest 12 packages are ESM-only (`"type": "module"`). The tests use Vitest because it loads ESM natively; Jest could only do so on Node >= 24.9 with `--experimental-vm-modules`. The devDeps are on Nest 12, and CI also tests Nest 11 (see above). The library ships as CJS and imports `@nestjs/common` with `import type` only, so the emitted JS has no runtime dependency on Nest. Keep it that way.
