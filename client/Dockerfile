FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_YANDEX_API_KEY
RUN npm run build

FROM nginx:alpine

COPY --from=build /server/dist/ /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf
