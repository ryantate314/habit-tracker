# syntax=docker/dockerfile:1
FROM node:12.18.1 AS build
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
RUN npm run build

FROM node:12.18.1
WORKDIR /app
COPY --from=build /app/dist ./
VOLUME [ "/var/db" ]
CMD [ "node", "server.js" ]