FROM node:22 AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
EXPOSE 3002
CMD ["npm", "run", "dev:start"]

FROM base AS production
RUN npm ci
COPY . .
EXPOSE 3002
CMD ["npm", "run", "start"]