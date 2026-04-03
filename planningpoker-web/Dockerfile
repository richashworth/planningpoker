FROM node:20-alpine

EXPOSE 3000

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "run", "dev", "--", "--host"]
