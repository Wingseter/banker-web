# syntax=docker/dockerfile:1

# ----- build stage -------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# bcrypt builds a native addon on linux; pull in toolchain just for the build.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev deps from the same install we already did, leaving only what
# the runtime needs to copy.
RUN npm prune --omit=dev

# ----- runtime stage -----------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# wget is used by the HEALTHCHECK; the alpine base ships it as busybox already.
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY views ./views
COPY public ./public

USER app
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
  CMD wget --spider -q http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "dist/bin/www.js"]
