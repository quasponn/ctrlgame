FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/db.sqlite
ENV SEED_FAST=1
ENV CORS_ORIGIN=http://localhost:3001

EXPOSE 3001
CMD ["node", "server.js"]
