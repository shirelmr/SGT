FROM node:22-alpine
WORKDIR /app

# Install dependencies first (cached layer — only re-runs when package files change)
COPY package.json package-lock.json ./
RUN npm ci

# Copy everything else (src/ and prisma/ are overridden by volume mounts in dev)
COPY . .

EXPOSE 3000

# Generate Prisma client from the mounted schema, then start with hot-reload
CMD ["sh", "-c", "npx prisma generate && npm run dev"]
