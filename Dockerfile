FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma/ ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules/.prisma/ ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma/ ./node_modules/@prisma/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/prisma/ ./prisma/

RUN chown -R node:node /app
USER node

EXPOSE 4000

CMD ["node", "dist/src/main.js"]
