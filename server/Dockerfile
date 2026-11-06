FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/build ./build
COPY --from=build /app/.sequelizerc ./.sequelizerc
COPY --from=build /app/config/database.js ./config/database.js
COPY --from=build /app/db/migrations ./db/migrations
COPY --from=build /app/db/seeders/20240822073001-Roles.js ./db/seeders/20240822073001-Roles.js

ENV NODE_ENV=production
CMD ["node", "build/src/server.js"]
