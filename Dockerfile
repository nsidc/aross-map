FROM node:15-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Intentionally avoid copying node_modules; that would overwrite what we just
# installed.
COPY src ./src
COPY public ./public
COPY ./tsconfig.json .
EXPOSE 3000

CMD ["npm", "start"]
