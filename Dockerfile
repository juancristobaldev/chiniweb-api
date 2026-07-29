FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma/ ./prisma/

RUN npm ci

COPY --from=builder /app/node_modules/.prisma/ ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma/ ./node_modules/@prisma/
COPY --from=builder /app/dist/ ./dist/

EXPOSE 4000

CMD ["node", "dist/src/main.js"]