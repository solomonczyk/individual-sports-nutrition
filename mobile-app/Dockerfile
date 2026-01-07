# Web App Dockerfile
FROM node:20-alpine AS base

# Install dependencies for building
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build for web
ENV NODE_ENV=production
ENV EXPO_PUBLIC_API_URL=http://152.53.227.37:8090/api/v1
ENV EXPO_PUBLIC_ENV=production

# Export static web build
RUN npx expo export --platform web

# Production stage
FROM nginx:alpine AS runner

# Copy built files to nginx
COPY --from=base /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]