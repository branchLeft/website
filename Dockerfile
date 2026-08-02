# syntax=docker/dockerfile:1.7

FROM node@sha256:233761595746769ebfdb6090f44fc7cdf818ae0ce62d2b37e0367723b9823e36 AS base
# ^ node:26.5.1-alpine (alpine 3.24) — resolved via `docker buildx imagetools inspect node:26-alpine`
ENV CI=true
RUN npm install --global pnpm@11.17.0
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
USER node
CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
