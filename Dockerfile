FROM oven/bun:1.3.14 AS builder
WORKDIR /app

# Copy all files
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN bun install && bun run build

# Install backend deps
WORKDIR /app/backend
RUN bun install

# ─── Runtime ───
FROM oven/bun:1.3.14
WORKDIR /app

# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy backend + node_modules
COPY --from=builder /app/backend ./backend

# Copy seed.json (optional, for seed command)
COPY --from=builder /app/seed.json ./seed.json

WORKDIR /app/backend
EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "src/index.ts"]
