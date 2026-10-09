# Stage 1: Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Instalar dependencias requeridas para compilar módulos nativos (better-sqlite3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Habilitar Corepack para pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml ./

# Instalación de dependencias con lockfile estricto
RUN pnpm install --frozen-lockfile

COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compilación TypeScript a dist/
RUN pnpm build

# Limpiar dependencias de desarrollo para producción
RUN pnpm prune --prod

# Stage 2: Production runner stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_DATABASE=/app/data/database.sqlite

# Directorio con permisos para persistencia de base de datos SQLite
RUN mkdir -p /app/data && chown -R node:node /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 3000

VOLUME ["/app/data"]

CMD ["node", "dist/main"]

