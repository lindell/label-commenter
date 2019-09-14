FROM node:slim

ADD package* ./
RUN npm install
ADD . .

RUN npm run build && npm start

ENTRYPOINT ["node", "/src/main.js"]
