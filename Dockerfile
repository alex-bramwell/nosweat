# syntax=docker/dockerfile:1
#
# Single multi-stage Dockerfile for every build target. Pick a stage with
# `target:` in the compose files:
#   docker-compose.yml       -> dev          (frontend + backend, hot reload)
#   docker-compose.prod.yml  -> web + api    (nginx static frontend + Express backend)

# Shared base: Node + project manifests.
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# dev: one image for BOTH the Vite frontend and the Express backend in local
# development. docker-compose mounts the source and provides the command, so this
# image only needs all dependencies installed.
FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# build: compile the production frontend bundle.
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# web: production frontend served by nginx (static files from the build stage).
FROM nginx:alpine AS web
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# api: production Express backend. Runs the same /api handlers as Vercel via the
# server/index.ts adapter. A full install is required because the server runs
# through tsx (a devDependency) at runtime.
FROM base AS api
RUN npm install
COPY server ./server
COPY api ./api
EXPOSE 3001
CMD ["npm", "run", "server:prod"]
