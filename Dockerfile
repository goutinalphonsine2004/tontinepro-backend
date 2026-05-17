FROM node:20-alpine AS builder

WORKDIR /app

# Dépendances système pour Prisma + argon2
RUN apk add --no-cache openssl libc6-compat python3 make g++

# Installer les dépendances
COPY package*.json ./
RUN npm ci

# Copier le schéma et la config Prisma
COPY prisma ./prisma/
COPY prisma.config.js ./

# Générer le client Prisma (DATABASE_URL passé comme build arg pour CI)
ARG DATABASE_URL=postgresql://ci:ci@localhost:5432/ci
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate

# Copier le reste et compiler TypeScript
COPY . .
RUN npm run build

# ── Image de production (légère) ──────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Copier uniquement ce qui est nécessaire au runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
