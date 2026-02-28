FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/tsconfig/ ./packages/tsconfig/

RUN npm install

# Copy source
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Generate Prisma client
RUN cd packages/database && npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev", "--workspace=@devmetrics/web"]