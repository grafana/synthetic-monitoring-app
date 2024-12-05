FROM node:18-alpine

WORKDIR /app/plugin
RUN apk add git python3 make g++
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn install
COPY  . .
CMD ["yarn", "build"]
