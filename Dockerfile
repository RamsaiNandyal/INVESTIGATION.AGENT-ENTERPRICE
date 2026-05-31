# ==========================================
# Stage 1: Build the frontend React app
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy project files
COPY . .

# Build the frontend assets
RUN npm run build

# ==========================================
# Stage 2: Run the production application
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy server and database files
COPY server.js database.js emailService.js ./
# Copy resources (logo icons, etc.)
COPY icon/ ./icon/

# Copy compiled frontend from stage 1
COPY --from=builder /app/dist ./dist

# Expose port (Express server defaults to 3001)
EXPOSE 3001

# Command to run the application
CMD ["npm", "start"]
