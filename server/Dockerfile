FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm install
COPY . .
EXPOSE 3002
CMD sh -c "npm run test && npm run dev:start || (echo 'Server tests failed!' && exit 1)"

FROM base AS production
RUN npm ci --only=production
COPY . .
EXPOSE 3002
CMD ["npm", "run", "start"]