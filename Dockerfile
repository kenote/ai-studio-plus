FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .

RUN npm run build:spa

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --prefer-offline

RUN apk add --no-cache tini

RUN addgroup -g 101 appuser && adduser -u 101 -G appuser -s /bin/sh -D appuser

COPY --from=builder /app/dist ./dist
COPY prod.server.cjs ./dist/server/

RUN chown -R appuser:appuser /app/node_modules /app/dist

USER appuser

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server/prod.server.cjs"]