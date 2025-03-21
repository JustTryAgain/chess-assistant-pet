FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS production
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]

FROM base AS development
RUN npm install
COPY . .
EXPOSE 3000
CMD sh -c "npm run test && npm run dev || (echo 'Client tests failed!' && exit 1)"