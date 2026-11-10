# syntax=docker/dockerfile:1.7

FROM node@sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216 AS base
# ^ node:26.13.0-alpine (alpine 3.24) — resolved via `docker buildx imagetools inspect node:26.13.0-alpine`
ENV CI=true
# The base's zlib 1.3.2 carries CVE-2026-4738 (critical); 1.4-r0 is the alpine 3.24 fix.
RUN apk add --no-cache zlib=1.4-r0
# npm and pnpm move together: the npm bundled with node and pnpm 11.17.0 each carry
# undici, tar and brace-expansion versions with published fixes.
RUN npm install --global npm@12.2.2 pnpm@11.28.11
WORKDIR /app

FROM base AS dependencies-env
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# pnpm refuses to expand ${NODE_AUTH_TOKEN} from a project-level .npmrc (it's
# committed to this public repo, so pnpm won't trust env expansion there —
# see the warning at https://pnpm.io/npmrc). Put the auth line in the user
# config instead, exactly as CLAUDE.md instructs contributors to for local
# dev. Only the literal placeholder is written to this layer, never the token.
RUN echo '//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}' >> /root/.npmrc
RUN --mount=type=secret,id=node_auth_token \
    NODE_AUTH_TOKEN=$(cat /run/secrets/node_auth_token) pnpm install --frozen-lockfile

FROM dependencies-env AS production-dependencies-env
RUN --mount=type=secret,id=node_auth_token \
    NODE_AUTH_TOKEN=$(cat /run/secrets/node_auth_token) pnpm install --frozen-lockfile --prod

FROM dependencies-env AS build-env
COPY . .
RUN pnpm build

FROM base
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=production-dependencies-env /app/node_modules ./node_modules
COPY --chown=node:node --from=build-env /app/build ./build
# Plain Node, outside the Vite build: the website-metrics Compose service
# (deploy/compose.yml) overrides CMD to run server/metrics-server.mjs from
# this same image instead of react-router-serve.
COPY --chown=node:node server ./server
USER node
CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
