FROM node:lts-alpine as alpine
ENV TZ=America/Argentina/Buenos_Aires
COPY . /app
WORKDIR /app
RUN npm install
RUN chown -R node:node /app
USER node
CMD node miner-check.js
