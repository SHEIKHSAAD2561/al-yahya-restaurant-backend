# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo currently contains a single project: `backend/`, a NestJS (TypeScript) application. It is a nested git repository (has its own `.git`), so treat it as the working root for backend commands — run all commands below from inside `backend/`.

The backend is presently an unmodified `nest new` scaffold (default `AppController`/`AppService` returning "Hello World!", no database, no additional modules, no auth). There is no frontend in this repo yet.

## Commands

Run from `backend/`:

- `npm run start:dev` — run the server in watch mode (default port 3001, overridable via `PORT` env var; see `src/main.ts`)
- `npm run start` — run without watch
- `npm run start:debug` — watch mode with debugger attached
- `npm run build` — compile with `nest build` (output to `dist/`)
- `npm run start:prod` — run the compiled build (`node dist/main`)
- `npm run lint` — ESLint with `--fix` over `src`, `apps`, `libs`, `test`
- `npm run format` — Prettier `--write` over `src/**/*.ts` and `test/**/*.ts`
- `npm run test` — unit tests (Jest, matches `*.spec.ts` under `src/`)
  - single test file: `npm run test -- app.controller.spec.ts`
  - by name: `npm run test -- -t "test name"`
- `npm run test:watch` — unit tests in watch mode
- `npm run test:cov` — unit tests with coverage report (`coverage/`)
- `npm run test:e2e` — e2e tests (separate Jest config at `test/jest-e2e.json`)

## Architecture

Standard NestJS module structure:

- `src/main.ts` — bootstraps the app via `NestFactory.create(AppModule)`, listens on `process.env.PORT ?? 3001`.
- `src/app.module.ts` — root module; wires controllers/providers together. New feature modules should be registered here (or nested under their own modules and imported here).
- `src/app.controller.ts` / `src/app.service.ts` — the default controller/service pair; NestJS's standard dependency-injection pattern (controllers handle routing, services hold logic, injected via constructor).

Config notes:
- TypeScript target is ES2023, module resolution `nodenext`, decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`) — required for NestJS's decorator-based DI.
- ESLint uses `typescript-eslint`'s `recommendedTypeChecked` plus `eslint-plugin-prettier`; `no-explicit-any` is turned off, `no-floating-promises` and `no-unsafe-argument` are warnings (not errors).
- Prettier: single quotes, trailing commas everywhere (`.prettierrc`).
