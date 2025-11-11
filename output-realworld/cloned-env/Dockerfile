# Use Node.js 20 with Alpine Linux
FROM node:20-alpine

# Install pnpm 9.15.1
RUN npm install -g pnpm@9.15.1

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./

# Copy server package files
COPY server/package.json ./server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3002

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Start the server
CMD ["pnpm", "start"]