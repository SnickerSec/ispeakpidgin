# syntax=docker/dockerfile:1.7

# --- Stage 1: build ---
# Installs devDeps and runs the static site build.
FROM node:20-slim AS build
WORKDIR /app

# Install deps with lockfile (includes devDeps). npm cache is mounted so
# repeat builds reuse downloaded tarballs.
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,id=npm,target=/root/.npm,sharing=locked \
    npm ci --prefer-offline

# Copy everything needed by the build script.
COPY build.js ./
COPY src/ ./src/
COPY tools/ ./tools/
COPY scripts/ ./scripts/
COPY data/ ./data/

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
RUN --mount=type=cache,id=npm,target=/root/.npm,sharing=locked \
    npm ci --omit=dev --prefer-offline

# Runtime code + built static output from the build stage.
COPY server.js ./
COPY routes/ ./routes/
COPY middleware/ ./middleware/
COPY services/ ./services/
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
