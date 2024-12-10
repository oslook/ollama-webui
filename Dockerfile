# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm ci --verbose && \
    # Install peer dependencies
    npm install -g postcss postcss-cli autoprefixer

# Copy all files
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application with verbose output
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
RUN chown -R nextjs:nodejs .

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "server.js"] 