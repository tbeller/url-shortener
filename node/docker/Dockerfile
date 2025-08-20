# Multi-stage Dockerfile for URL Shortener
# This Dockerfile builds both the API and serves the frontend

FROM node:20-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY api/package*.json ./
RUN npm install --only=production && npm cache clean --force

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN npm install && npm cache clean --force
COPY api/ .
COPY frontend/ ./public/
# Create data directory for SQLite database
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "dev"]

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY api/ .
COPY frontend/ ./public/
# Create data directory for SQLite database
RUN mkdir -p /app/data

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S urlshortener -u 1001

# Change ownership
RUN chown -R urlshortener:nodejs /app
USER urlshortener

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["dumb-init", "node", "src/server.js"]
