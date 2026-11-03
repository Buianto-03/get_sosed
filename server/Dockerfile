FROM node:22-alpine3.19
WORKDIR /app
COPY package*.json ./
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
