# --- Stage 1: Build the React Application ---
FROM node:18-alpine as builder

WORKDIR /app

# Copy package definition
COPY package*.json ./

# Install dependencies
# CHANGED: 'npm ci' -> 'npm install' to fix the missing lockfile error
RUN npm install

# Copy source code
COPY . .

# Build for production
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy build artifacts from Stage 1
# (Vite builds to /dist by default)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the entrypoint script
COPY entrypoint.sh /docker-entrypoint.d/40-env-injector.sh
RUN chmod +x /docker-entrypoint.d/40-env-injector.sh

# Expose the internal port (Nginx defaults to 80)
EXPOSE 80

# Nginx image automatically runs entrypoint scripts in /docker-entrypoint.d/
CMD ["nginx", "-g", "daemon off;"]