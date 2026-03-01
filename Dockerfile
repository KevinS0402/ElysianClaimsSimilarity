# Use the official Bun image
FROM oven/bun:1

# Set the working directory
WORKDIR /app

# Copy the package files and install dependencies
COPY package.json bun.lockb ./
RUN bun install --production

# Copy the rest of the application code
COPY . .

# Expose the port Cloud Run expects
EXPOSE 8080

# Start the server
CMD ["bun", "run", "server.js"]