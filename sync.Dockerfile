FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* turbo.json ./
COPY apps/sync-service/package.json ./apps/sync-service/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/tsconfig/ ./packages/tsconfig/

RUN npm install

# Copy source
COPY packages/ ./packages/
COPY apps/sync-service/ ./apps/sync-service/

# Generate Prisma client
RUN cd packages/database && npx prisma generate

EXPOSE 4002
CMD ["npm", "run", "dev", "--workspace=@devmetrics/sync-service"]
