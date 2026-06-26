# Production Dockerfile for OrderVoice AI Orchestrator

# --- Stage 1: Build the frontend Assets ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Compile client-side Vite and output to dist/
RUN npm run build

# --- Stage 2: Final Production Runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only necessary production libraries
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled backend & web UI bundle from installer stage
COPY --from=frontend-builder /app/dist ./dist
COPY --from=frontend-builder /app/server.ts ./server.ts

# Ensure runtime tools are installed
RUN npm install -g tsx esbuild @types/node

# Package the backend bundle using esbuild for performance
RUN esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

EXPOSE 3000

# Command to execute full-stack Express server acting as web ingress proxy
CMD ["node", "dist/server.cjs"]
