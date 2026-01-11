FROM node:18-alpine

WORKDIR /tests

COPY package.json ./
COPY e2e.test.js ./

CMD ["npm", "test"]
