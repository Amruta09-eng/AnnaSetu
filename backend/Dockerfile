# Multi-stage Dockerfile for AnnaSetu Backend
FROM node:24-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/

# Create persistent data directory for SQLite
RUN mkdir -p /app/data

# Environment configuration
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_FILE=/app/data/annasetu.db
ENV CORS_ORIGIN=*

EXPOSE 5000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the server
CMD ["node", "src/server.js"]
