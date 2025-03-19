FROM node:22 AS base
WORKDIR /app
COPY package*.json ./

FROM base AS production
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]

FROM base AS development
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "dev"]