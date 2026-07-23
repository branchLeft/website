---
name: react-router
description: Build and modify React Router v7 Framework Mode applications. Use when configuring routes, route modules, loaders, actions, forms, fetchers, navigation, pending UI, SSR, pre-rendering, middleware, URL params/search params, or React Router upgrades. This app is locked to Framework Mode — do not apply Data or Declarative Mode patterns.
license: MIT
---

# React Router

This app is locked to **React Router v7 Framework Mode** with SSR. Always read `references/framework-mode.md` before making changes to routing, rendering, or data loading.

## This App: Framework Mode

This app uses Framework Mode. You will see:

- `@react-router/dev` in dependencies
- `react-router.config.ts` with `ssr: true`
- `app/routes.ts` with manual route config using `route()`, `index()`, `layout()`, and `prefix()`
- route modules under `app/routes/`
- route exports like `loader`, `action`, `clientLoader`, `clientAction`, `ErrorBoundary`, `meta`, `links`, `handle`, `shouldRevalidate`, `middleware`
- type imports from `./+types/<route>`
- the `reactRouter()` Vite plugin from `@react-router/dev/vite`

**Always read `references/framework-mode.md`** for patterns, rules, and doc pointers.

## Legacy Patterns to Migrate

If you encounter any of the following patterns in this codebase, they are not intentional — they are legacy or copy-paste errors and should be migrated to Framework Mode equivalents:

- `createBrowserRouter`, `createHashRouter`, `createMemoryRouter`, `<RouterProvider>` — Data Mode; replace with route modules and `app/routes.ts`
- `<BrowserRouter>`, `<HashRouter>`, `<Routes>`, `<Route element={...}>` — Declarative Mode; replace with Framework Mode route modules
- `ssr: false` in `react-router.config.ts` — SPA mode; prohibited in this app

Read `references/framework-mode.md` for the equivalent Framework Mode approach before making migration changes.

## RSC: Future Path (Not Active)

React Server Components (`unstable_reactRouterRSC`) is the natural evolution of Framework Mode and has been intentionally left out until it stabilizes. Do not introduce RSC APIs, `@vitejs/plugin-rsc`, `"use client"` directives, or RSC entry files. If RSC is needed in the future, restore the `references/rsc.md` file before making changes.

## Use Installed Docs as Source of Truth

React Router ships markdown docs in the package so guidance can match the installed version:

```txt
node_modules/react-router/docs/
```

Key docs paths:

```txt
node_modules/react-router/docs/index.md
node_modules/react-router/docs/start/framework/
node_modules/react-router/docs/how-to/
node_modules/react-router/docs/explanation/
node_modules/react-router/docs/upgrading/
```

When this skill references `react-router/docs/...`, read the matching file under `node_modules/react-router/docs/`. Most docs include a mode marker near the top:

```txt
[MODES: framework, data, declarative]
```

Only apply a doc when its mode marker includes `framework`.

## Skill References

Load the relevant reference after identifying the mode:

| Reference                        | Use When                                      |
| -------------------------------- | --------------------------------------------- |
| `references/framework-mode.md`   | Framework Mode or RSC Framework base behavior |
| `references/data-mode.md`        | Data Mode or RSC Data base behavior           |
| `references/declarative-mode.md` | Declarative Mode                              |
| `references/rsc.md`              | Any unstable RSC app                          |

## Mode Migration Doc Index

If the user explicitly asks to switch modes, read the target mode reference plus the migration-relevant docs:

| Migration                            | Docs to read                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Declarative → Data                   | `react-router/docs/start/modes.md`, `react-router/docs/start/data/routing.md`, `react-router/docs/start/data/data-loading.md`, `react-router/docs/start/data/actions.md`                                                              |
| Declarative/Data → Framework         | `react-router/docs/start/modes.md`, `react-router/docs/start/framework/routing.md`, `react-router/docs/start/framework/route-module.md`, `react-router/docs/how-to/route-module-type-safety.md`                                       |
| Framework SPA/SSR/pre-render changes | `react-router/docs/start/framework/rendering.md`, `react-router/docs/how-to/spa.md`, `react-router/docs/how-to/pre-rendering.md`, `react-router/docs/start/framework/data-loading.md`, `react-router/docs/start/framework/actions.md` |
| Future flags/upgrades                | `react-router/docs/upgrading/future.md` and relevant files under `react-router/docs/upgrading/`                                                                                                                                       |
