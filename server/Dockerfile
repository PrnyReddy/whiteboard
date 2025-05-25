FROM node:18-alpine

WORKDIR /usr/src/app

COPY ./server/package*.json ./

# Install all dependencies
RUN npm ci

# Copy source files
COPY ./server/tsconfig.json ./
COPY ./server/src ./src

# Build TypeScript
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production

EXPOSE 3001

CMD ["npm", "start"]
