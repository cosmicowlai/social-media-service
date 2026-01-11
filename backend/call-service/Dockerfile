FROM node:18-alpine

WORKDIR /app

COPY call-service/package.json call-service/tsconfig.json ./call-service/
COPY call-service/src ./call-service/src
COPY shared/src ./shared/src

WORKDIR /app/call-service

RUN npm install
RUN npm run build

EXPOSE 3002

CMD ["npm", "run", "start"]
