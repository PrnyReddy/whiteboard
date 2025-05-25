FROM node:18-alpine

WORKDIR /usr/src/app

# Create and copy into server directory
RUN mkdir -p server
WORKDIR /usr/src/app/server

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Clean and install production dependencies
RUN npm prune --production

EXPOSE 3001

CMD ["npm", "start"]
