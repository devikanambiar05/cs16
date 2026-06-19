# ── Dockerfile ────────────────────────────────────────────────────────────────
# Multi-stage build for all environments.
# Named stages referenced by docker-compose.yml and Dockerfile.prod logic.
#
# Stages:
#   server-dev   → Express + nodemon (hot-reload)
#   server-prod  → Express, production-optimised
#   client-dev   → Vite dev server with HMR
#   client-build → Builds static files for production
#   prod         → Single image: built client served by Express

# ── Shared base ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
WORKDIR /app

# ─────────────────────────────────────────────────────────────────────────────
# SERVER — Development (nodemon hot-reload)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS server-dev
COPY server/package.json server/package-lock.json ./
RUN npm install
# Source is bind-mounted at runtime via docker-compose — no COPY needed
CMD ["npx", "nodemon", "server.js"]

# ─────────────────────────────────────────────────────────────────────────────
# SERVER — Production
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS server-prod
COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev
COPY server/ ./
EXPOSE 5000
CMD ["node", "server.js"]

# ─────────────────────────────────────────────────────────────────────────────
# CLIENT — Development (Vite HMR)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS client-dev
COPY client/package.json client/package-lock.json ./
RUN npm install
# Source is bind-mounted at runtime via docker-compose
CMD ["npx", "vite", "--host", "0.0.0.0"]

# ─────────────────────────────────────────────────────────────────────────────
# CLIENT — Build static files
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS client-build
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build
# Output: /app/dist

# ─────────────────────────────────────────────────────────────────────────────
# PRODUCTION — Express serves the built Vite client (single container)
# Used by docker-compose.prod.yml
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS prod
COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev
COPY server/ ./
# Pull the compiled client from the build stage
COPY --from=client-build /app/dist ./public
EXPOSE 5000
CMD ["node", "server.js"]
