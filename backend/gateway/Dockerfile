FROM node:18-alpine

WORKDIR /app

COPY gateway/package.json gateway/tsconfig.json ./gateway/
COPY gateway/src ./gateway/src
COPY shared/src ./shared/src

WORKDIR /app/gateway

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
