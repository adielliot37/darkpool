FROM node:20-slim

WORKDIR /app

COPY node/package.json node/package-lock.json* ./
RUN npm install

COPY node/ ./
RUN npm run build

EXPOSE 8545

CMD ["node", "dist/index.js"]
