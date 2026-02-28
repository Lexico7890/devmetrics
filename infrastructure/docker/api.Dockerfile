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

# Generate Prisma client
RUN cd packages/database && npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev", "--workspace=@devmetrics/api"]