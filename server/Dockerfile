FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY ./server/package*.json ./
COPY ./server/tsconfig.json ./
COPY ./server/src ./src

# Install dependencies and build
RUN npm install
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
