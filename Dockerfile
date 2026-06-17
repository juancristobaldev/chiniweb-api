FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma/ ./prisma/
RUN npm ci
COPY src/ ./src/
COPY tsconfig.json nest-cli.json ./
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma/ ./prisma/
RUN npm ci --omit=dev
COPY --from=builder /app/node_modules/.prisma/ ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma/ ./node_modules/@prisma/
COPY --from=builder /app/dist/ ./dist/
EXPOSE 4000
CMD ["node", "-r", "tsconfig-paths/register", "dist/main"]
