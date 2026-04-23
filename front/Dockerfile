FROM node:22-alpine
WORKDIR /app

# Install dependencies first (cached layer — only re-runs when package files change)
COPY package.json package-lock.json ./
RUN npm ci

# Copy everything else (src/ is overridden by volume mount in dev)
COPY . .

EXPOSE 5173

# --host makes Vite listen on 0.0.0.0 so Docker can forward the port
CMD ["npm", "run", "dev", "--", "--host"]
