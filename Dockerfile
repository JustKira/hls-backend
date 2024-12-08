FROM node:18-slim

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies with no security checks
RUN pnpm install --no-strict-ssl --unsafe-perm

# Copy source code
COPY . .

# Create HLS output directory with permissive permissions
RUN mkdir -p hls_output && chmod 777 hls_output

# Expose port
EXPOSE 8777

# Start the application
CMD ["node", "index.js"]