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
  npm run build; \
fi

# These lines are only required in case a developer wants to use this stage of
# the build to run a dev server (see docker-compose.dev.yml).
EXPOSE 3000
CMD ["npm", "start"]


FROM nginx:1.19-alpine AS server

WORKDIR /usr/share/nginx/html
COPY --from=builder /app/build .
