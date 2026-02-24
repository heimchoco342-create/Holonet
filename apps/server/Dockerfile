FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared

# Generate Prisma client
WORKDIR /app/apps/server
RUN pnpm db:generate

# Build
RUN pnpm build

EXPOSE 3001

CMD ["pnpm", "start"]
