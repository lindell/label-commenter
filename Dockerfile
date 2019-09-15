FROM node:slim

ADD package* ./
RUN npm install
ADD . .

RUN npm run build

ENTRYPOINT ["node", "/lib/main.js"]
