# syntax=docker/dockerfile:1
FROM node:lts-alpine AS build
WORKDIR /app
RUN npm install -g typescript
COPY ["package.json", "package-lock.json*", "tsconfig.json", "./"]
RUN npm install
COPY src/ @types/ ./
RUN npm run build

FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY --from=build /app/dist ./
COPY .env ./
EXPOSE 80
VOLUME [ "/var/db" ]
CMD [ "node", "src/app.js" ]
