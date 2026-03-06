FROM node:20-alpine

WORKDIR /app

ARG DATABASE_URL=postgresql://lnu:lnu123@postgres:5432/lnu_assets?schema=public
ENV DATABASE_URL=${DATABASE_URL}

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
