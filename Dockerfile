# Lightweight Dockerfile for running VoiceHub Auth Broker
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package manifest first for cache-friendly installs
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm install --production --silent

# Copy app source
COPY . .

# Expose default port
EXPOSE 3000

# Default env - container runs in production mode by default.
ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
