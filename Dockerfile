FROM node:18-slim

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Create necessary directories
RUN mkdir -p assets hls_output && \
    chmod 777 hls_output && \
    chmod 777 assets

# Copy package files first (for better caching)
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# IMPORTANT: Copy the test video file
COPY assets/test.mp4 /usr/src/app/assets/

# Verify the file exists (this will fail the build if the file is missing)
RUN ls -la /usr/src/app/assets/test.mp4

# Expose port
EXPOSE 8777

# Start the application
CMD ["node", "index.js"]