# syntax=docker/dockerfile:1

# Build stage
FROM --platform=$BUILDPLATFORM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies only when needed
COPY package.json bun.lock ./

# Install dependencies from the lockfile (fails if lockfile is out of date)
RUN bun install --frozen-lockfile

# Copy all files
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN bun run build

# Production stage
FROM --platform=$TARGETPLATFORM node:22-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder.
# The standalone output already bundles server.js, package.json and
# a minimal node_modules, so only public/ and the static assets are extra.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]