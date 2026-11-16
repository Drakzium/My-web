FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY server ./server
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV PORT=3001

RUN mkdir -p /data/data /data/uploads
VOLUME ["/data"]
EXPOSE 3001

CMD ["npx", "tsx", "server/index.ts"]
