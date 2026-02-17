# Multi-stage build for Vite React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create .env file with build-time variables
RUN echo "NEXT_PUBLIC_SUPABASE_URL=https://mfcdlqixqydyrcflkmag.supabase.co" > .env.production && \
    echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_oWKU3CCosDOn668-0zGQJQ_a7iQyD5T" >> .env.production && \
    echo "DATABASE_URL=postgresql://postgres:Sirgeorge@12@db.mfcdlqixqydyrcflkmag.supabase.co:5432/postgres" >> .env.production

# Build the app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the static site
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Set runtime environment variables
ENV NEXT_PUBLIC_SUPABASE_URL=https://mfcdlqixqydyrcflkmag.supabase.co
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_oWKU3CCosDOn668-0zGQJQ_a7iQyD5T
ENV DATABASE_URL=postgresql://postgres:Sirgeorge@12@db.mfcdlqixqydyrcflkmag.supabase.co:5432/postgres

# Expose port
EXPOSE 8080

# Start the app
CMD ["serve", "-s", "dist", "-l", "8080"]
