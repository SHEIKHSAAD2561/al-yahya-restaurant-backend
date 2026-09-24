# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo is the NestJS (TypeScript) backend itself — `src/`, `test/`, and `package.json` live at the repo root. The frontend is a sibling repo at `../al-yahya-restaurant-frontend` (see that repo's own CLAUDE.md); this backend has no knowledge of it beyond `APP_URL` (see Environment below).

Single-tenant: this serves exactly one restaurant. No multi-tenancy, no per-company scoping anywhere in the schema.

## Commands

Run from the repo root:

- `npm run start:dev` — watch mode (port 3001, overridable via `PORT`)
- `npm run build` — compile with `nest build` → `dist/`
- `npm run start:prod` — run the compiled build
- `npm run lint` / `npm run format`
- `npm run test` (Jest, `*.spec.ts`) — single file: `npm run test -- app.controller.spec.ts`; by name: `npm run test -- -t "test name"`
- `npm run test:e2e`

Database (TypeORM migrations — `DB_SYNCHRONIZE` is `false`, schema changes always go through a migration, never auto-sync):
- `npm run migration:generate -- src/database/migrations/DescriptiveName` — diffs entities against the DB and writes a migration. **Check the generated file before running it** — for anything already holding data, prefer rewriting a generated `DROP COLUMN`+`ADD COLUMN` pair into an in-place `MODIFY COLUMN` (TypeORM's generator defaults to the destructive form even for a plain type-widening change).
- `npm run migration:run`
- `npm run seed` — idempotent (upserts by unique key): loads the full permission catalog, the 6 system roles (with bilingual descriptions), the 3 system taxes, grants Super Admin/Admin every permission, and bootstraps the initial Super Admin user from `SUPER_ADMIN_*` env vars (only if that email doesn't already exist). Safe to re-run any time the permission catalog/system-role/system-tax definitions change — never touches a role's already-configured permissions for non-system roles, and never touches a CUSTOM tax.

## Architecture

Standard NestJS module structure under `src/modules/`: `auth`, `users`, `roles`, `permissions`, `locations`, `company`, `taxes`, `storage`, `mail`. `src/common/` holds cross-cutting guards/decorators; `src/database/` holds the data source, migrations, and `seed.ts`.

### Auth & sessions

JWT access token (short-lived, `JWT_ACCESS_EXPIRES_IN`) + rotating opaque refresh token (raw random token, only its hash stored in `refresh_tokens`; reuse of an already-rotated token revokes every session for that user — theft detection). The access token payload is deliberately minimal (`{sub}` only) — role/permissions are always resolved fresh from the DB in `JwtStrategy.validate()` via `UsersService.findAuthProfile()`, never cached in the token itself.

`GET /auth/me` returns the caller's profile (id/name/role/permissionCodes) — this is what the frontend's BFF calls right after login to build its own session cookie; nothing else in this backend depends on it.

Password reset and first-time invitation share one mechanism: `User.passwordResetTokenHash`/`passwordResetTokenExpiresAt` + `POST /auth/accept-invitation {token, password}` consumes it either way (`UsersService.setPassword` activates a PENDING user or just updates an ACTIVE one's password — same code path). `POST /auth/forgot-password` only *issues* a fresh token for an existing ACTIVE user; it always returns success regardless of whether the email exists, to avoid account enumeration.

### RBAC model

One role per user (`User.roleId`, not an array — this is intentional, not a v1 limitation). `RoleType` is `SUPER_ADMIN | ADMIN | DEFAULT | CUSTOM`. `PermissionsGuard` (`common/guards/permissions.guard.ts`) is deliberately dumb — it only ever compares `request.user.permissionCodes` against `@RequirePermissions(...)` metadata; Super Admin/Admin pass because they're *seeded* with every permission code (by `seed.ts`), not because the guard special-cases their role type. All the "who can do what to which role" business rules (only Super Admin creates/deletes CUSTOM roles, Admin/Super Admin's own permissions can't be edited, etc.) live in `RolesService`, not the guard — read the comment at the top of that file before changing role-related authorization.

**Permission catalog vs. enforcement — these are deliberately decoupled.** `permission-catalog.ts` lists the *full* target permission set for every module (POS, Customers, Products, Stock, Purchases & Suppliers, Expenses, Accounting, Dashboard, Reports, Settings — 73 permissions total as of the last catalog update), matching the intended final product design. Most of these are **not enforced anywhere yet** — `@RequirePermissions()` only guards routes that actually exist (currently: users, roles, permissions, locations, company, taxes). A permission existing in the catalog and being toggleable in the frontend's Roles & Permissions UI does not imply its feature is built; it becomes real only when that module's endpoints are built and start checking it. Don't treat an unguarded permission as a bug — check whether the corresponding feature module exists first. Note `settings.financial_settings` already covers taxes/payment methods/inventory config, and `settings.general_account_setup` covers company overview/custom fields — check for an existing catalog entry before adding a new permission code for a new Settings sub-feature.

### TypeORM gotcha (real bug, already fixed once — don't reintroduce it)

Entities that have **both** a raw `@Column()` for a foreign key and a `@ManyToOne` + `@JoinColumn` relation mapped to that same column (e.g. `User.roleId` + `User.role`) must keep both in sync when mutating. If a relation is eager-loaded (or was joined by an earlier `findOne`) and you only reassign the raw FK column (`user.roleId = newId`), TypeORM's `save()` persists based on the **loaded relation object**, not the raw column, and silently writes back the *old* value. Always update both together: `user.roleId = newId; user.role = newRoleEntity;`. This bit `UsersService.update()` for role reassignment; check any future direct FK mutation on an entity with a paired eager relation for the same issue.

### i18n

`nestjs-i18n`, catalogs under `src/i18n/{en,ar}/*.json` (one file per module: `auth`, `users`, `roles`, `locations`, `company`, `taxes`, `validation`). Resolved via `?lang=`, `x-lang` header, or `Accept-Language` — the frontend always sends `x-lang` explicitly. When adding a new user-facing error message, add both locale entries; don't hardcode English strings in a service (a few older ones exist as tech debt, e.g. some `BadRequestException` messages — don't copy that pattern for new code).

### Environment gotcha

`APP_URL` is the **frontend's** URL, not this API's — it's used only to build links inside emails (invite/reset) that a browser opens against the Next.js app, not this server. Mixing this up breaks every email link (this happened once already).

### Naming

`User` and `Role` both have bilingual `nameEn`/`nameAr` columns, not a single `name`. `Location` has a single `name` plus `isDefault` (`LocationsService` enforces exactly one default at a time; deleting the default location is rejected). `Role` also has bilingual `descriptionEn`/`descriptionAr` (nullable — only the 6 system roles are seeded with one; a CUSTOM role's description is optional at creation).

### File storage (Firebase, not local disk)

Every uploaded file (currently: the company logo) goes through `src/modules/storage/firebase-storage.service.ts` — a thin wrapper around the Firebase Admin SDK, not `multer` + local disk. Two things to know before touching it:
- URLs are Firebase's own download-token format (`firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=<token>`), not a plain GCS public-ACL URL. This is deliberate: newer Storage buckets have "uniform bucket-level access" on by default, which makes `file.makePublic()` fail outright, and it matches this project's existing Firebase convention (there are other objects already in the bucket using this format).
- Credentials (`FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`/`FIREBASE_STORAGE_BUCKET`) live in `.env` only, never `.env.example` with real values. `FIREBASE_PRIVATE_KEY` keeps its PEM's literal `\n` sequences in the `.env` file (double-quoted); the service `.replace(/\\n/g, '\n')`s it at read time.

Any new feature that uploads a file should reuse `FirebaseStorageService`, not reimplement multer/disk logic.

### Public (unauthenticated) endpoints

The global `JwtAuthGuard` requires a valid access token on every route unless `@Public()` is applied (see `common/decorators/public.decorator.ts`) — used today for the auth-establishing routes (`login`/`refresh`/`accept-invitation`/`forgot-password`) and `GET /company/branding`. That branding endpoint is deliberately a separate, narrower route from the full `GET /company` (which stays behind `settings.general_account_setup`) — it exists specifically so the frontend can brand its sidebar and browser-tab favicon even on the pre-login screen, returning only `{name, logoUrl}`. Follow this pattern (a narrow public projection, not loosening the real endpoint) if another feature needs something visible pre-login.

### Taxes: system vs. custom, locked vs. toggleable

`Tax.type` is `SYSTEM_LOCKED | SYSTEM_TOGGLABLE | CUSTOM` (`src/modules/taxes/tax-type.enum.ts`) — this is **not settable through the API**; `POST /taxes` always creates `CUSTOM` (always active, no status toggle, freely editable). `SYSTEM_LOCKED` (`Not Subject to Tax`, `VAT`) and `SYSTEM_TOGGLABLE` (`VAT + Tobacco Tax`) only ever come from `seed.ts`, are never editable (`TaxesService.update()` rejects non-`CUSTOM`), and only `SYSTEM_TOGGLABLE` can have its `isActive` flipped (`TaxesService.updateStatus()` rejects everything else). This mirrors Rewaa's own reference behavior, not an arbitrary design choice — check a fresh screenshot before assuming a new tax-related field should be editable.

A tax has one or more `TaxLine`s (label + rate, summed for the "subtotal") plus an optional single compound line (`Tax.compoundLabel`/`compoundRate`, gated by `Tax.hasCompoundTax`) that applies **on top of** the subtotal (tax-on-tax), not alongside it: effective rate = `subtotal + compound + subtotal*compound/100`. Don't just sum all rates flat when computing anything tax-related later.
