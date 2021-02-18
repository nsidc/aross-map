FROM node:15-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY src ./src
COPY public ./public

# Allow optional bypass of production build in case the user is only running
# webpack-dev-server.
ARG env="production"
RUN if [ "$env" = "production" ]; then \
  npm run build; \
fi

# At this point, nothing more needs to be done for a production build.
# Everything else in this image is for convenience in case the user wants to
# directly use this stage of the build to run a webpack-dev-server (see
# docker-compose.dev.yml).

# Intentionally avoid copying node_modules; that would overwrite what we just
# installed.
COPY tsconfig.json .eslintrc.js ./
EXPOSE 3000

CMD ["npm", "start"]


FROM nginx:1.19-alpine AS server

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/build .
