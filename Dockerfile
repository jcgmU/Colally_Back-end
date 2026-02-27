# ============================================
# Base stage - common dependencies
# ============================================
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat openssl

# ============================================
# Dependencies stage - install all dependencies
# ============================================
FROM base AS deps

COPY package.json package-lock.json* ./
RUN npm ci

# ============================================
# Development stage - for local development
# ============================================
FROM base AS development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "dev"]

# ============================================
# Builder stage - compile TypeScript
# ============================================
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Production stage - minimal runtime image
# ============================================
FROM base AS production

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 colally
USER colally

COPY --from=builder --chown=colally:nodejs /app/dist ./dist
COPY --from=builder --chown=colally:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=colally:nodejs /app/package.json ./package.json
COPY --from=builder --chown=colally:nodejs /app/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/main.js"]
