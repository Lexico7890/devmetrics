FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 1. Copiar todo el código (tu archivo .dockerignore evitará que se suba la basura)
COPY . .

# 2. Instalar dependencias completas
RUN npm install

# 3. Generar cliente de Prisma
RUN cd packages/database && npx prisma generate

# 4. CONSTRUIR CON TURBOREPO
RUN npx turbo run build --filter=@devmetrics/sync-service

EXPOSE 4002

# 5. Ejecutar en producción
CMD ["npm", "run", "start:prod", "--workspace=@devmetrics/sync-service"]