# NetShield AI — Frontend Dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Build React application
COPY . .
RUN npm run build

# Production Server stage with Nginx
FROM nginx:alpine

# Copy React build artifacts to Nginx html directory
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
