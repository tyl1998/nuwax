FROM node:22.10.0 AS builder

WORKDIR /app

# 先复制依赖清单，最大化利用 Docker layer cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

RUN npm install -g pnpm@10.27.0 --registry=https://registry.npmmirror.com

RUN pnpm install --frozen-lockfile

# 再复制源码，避免代码改动导致依赖层失效
COPY . .

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build:prod

FROM nginx:latest

WORKDIR /usr/share/nginx/html

COPY ./k8s/default.conf.template /etc/nginx/templates/default.conf.template
COPY ./docker/entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=builder /app/dist .

RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

ENV SERVER_NAME=_
ENV URI_NAME='$uri'
ENV API_PROXY_URL=http://host.docker.internal:8080
ENV NGINX_HOST='$host'
ENV NGINX_REMOTE_ADDR='$remote_addr'
ENV NGINX_PROXY_ADD_X_FORWARDED_FOR='$proxy_add_x_forwarded_for'
ENV NGINX_SCHEME='$scheme'
ENV NGINX_HTTP_UPGRADE='$http_upgrade'
ENV NGINX_CONNECTION_UPGRADE=upgrade
ENV COMPUTER_PROXY_URL=http://nuwax-backend:18085
ENV BASE_URL=
ENV WS_BASE_URL=
ENV ROUTER_BASENAME=
ENV PUBLIC_PATH=/
ENV ENABLE_MOBILE_REDIRECT=true
ENV WITH_CREDENTIALS=
ENV APP_ENV=
ENV APP_VERSION=

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]