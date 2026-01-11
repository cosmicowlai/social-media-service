FROM node:18-alpine

WORKDIR /app

COPY chat-service/package.json chat-service/tsconfig.json ./chat-service/
COPY chat-service/src ./chat-service/src
COPY shared/src ./shared/src

WORKDIR /app/chat-service

RUN npm install
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
