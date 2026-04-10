FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/tsconfig/ ./packages/tsconfig/

RUN npm install

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# 3. Generar cliente de Prisma
RUN cd packages/database && npx prisma generate

# 4. CONSTRUIR LA APLICACIÓN
RUN npm run build --workspace=@devmetrics/api

EXPOSE 4000

# 5. EJECUTAR EN MODO PRODUCCIÓN
CMD ["npm", "run", "start:prod", "--workspace=@devmetrics/api"]