FROM node:15-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Intentionally avoid copying node_modules; that would overwrite what we just
# installed.
COPY src ./src
COPY public ./public
COPY tsconfig.json .eslintrc.js ./

# Allow optional bypass of production build in case the user is only running
# webpack-dev-server.
ARG env="production"
RUN if [ "$env" = "production" ]; then \
  mkdir build && npm run build; \
fi

# These lines are only required in case a developer wants to use this stage of
# the build to run a dev server (see docker-compose.dev.yml).
EXPOSE 3000
CMD ["npm", "start"]


FROM nginx:1.19-alpine AS server

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/build .

# Make a self-signed SSL certificate
RUN mkdir /cert
COPY ./nginx/openssl.conf .
RUN apk add openssl
RUN openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -config openssl.conf \
    -keyout /cert/ssl.key -out /cert/ssl.crt

COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
