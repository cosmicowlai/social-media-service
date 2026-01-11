FROM node:18-alpine

WORKDIR /app

COPY message-worker/package.json message-worker/tsconfig.json ./message-worker/
COPY message-worker/src ./message-worker/src
COPY shared/src ./shared/src

WORKDIR /app/message-worker

RUN npm install
RUN npm run build

CMD ["npm", "run", "start"]
