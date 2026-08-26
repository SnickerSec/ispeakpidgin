# syntax=docker/dockerfile:1.7

# --- Stage 1: build ---
# Installs devDeps and runs the static site build.
FROM node:20-slim AS build
WORKDIR /app

# Install deps with lockfile (includes devDeps). Docker layer caching
# skips this step entirely when package.json / package-lock.json are
# unchanged between builds.
COPY package.json package-lock.json .npmrc ./
RUN npm ci --prefer-offline

# Copy everything needed by the build script. (`data/` isn't copied -
# all content lives in Supabase now; the build script tolerates its
# absence.)
COPY build.js ./
COPY src/ ./src/
COPY tools/ ./tools/
COPY scripts/ ./scripts/
COPY tailwind.config.js site.webmanifest robots.txt ./

# Supabase creds are needed by the page generators to fetch dictionary/
# phrase/story content at build time. Railway passes matching service
# env vars as build args when declared here. Anon key only - the
# service role key is never needed at build time and shouldn't be
# embedded in build layers.
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ENV SUPABASE_URL=$SUPABASE_URL \
    SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

RUN npm run build


# --- Stage 2: runtime ---
# Slim image with only prod deps + built assets + server code.
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --prefer-offline

# Runtime code + built static output from the build stage.
COPY server.js ./
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY services/ ./services/
# routes/tts.js and routes/admin.js require the canonical pronunciation map and
# synthesis settings from the speech engine, so this one source directory is
# runtime code, not just build input. Omitting it makes the server exit with
# MODULE_NOT_FOUND on boot -- the whole image, not just TTS. Keep this in sync
# with any new server-side require() that reaches into src/ -- and note that
# `npm run test:runtime-deps` now verifies this automatically by reading the
# COPY lines below, so widening this stage widens the check for free.
COPY src/components/speech/ ./src/components/speech/
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
