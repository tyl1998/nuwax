#!/bin/sh
set -eu

IMAGE_NAME="${IMAGE_NAME:-nuwax-frontend}"
IMAGE_TAG="${IMAGE_TAG:-${BUILD_NUMBER:-local}}"
CONTAINER_NAME="${CONTAINER_NAME:-nuwax-frontend}"
HOST_PORT="${HOST_PORT:-80}"
SERVER_NAME="${SERVER_NAME:-_}"
API_PROXY_URL="${API_PROXY_URL:-http://host.docker.internal:8080}"
APP_ENV="${APP_ENV:-prod}"

ROUTER_BASENAME="${ROUTER_BASENAME:-}"
PUBLIC_PATH="${PUBLIC_PATH:-/}"
ENABLE_MOBILE_REDIRECT="${ENABLE_MOBILE_REDIRECT:-true}"

ADD_HOST_ARGS=""
if [ "${ADD_HOST_GATEWAY:-true}" = "true" ]; then
  ADD_HOST_ARGS="--add-host=host.docker.internal:host-gateway"
fi

docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true

docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart=always \
  ${ADD_HOST_ARGS} \
  -p "${HOST_PORT}:80" \
  -e SERVER_NAME="${SERVER_NAME}" \
  -e API_PROXY_URL="${API_PROXY_URL}" \
  -e BASE_URL= \
  -e WS_BASE_URL= \
  -e ROUTER_BASENAME="${ROUTER_BASENAME}" \
  -e PUBLIC_PATH="${PUBLIC_PATH}" \
  -e ENABLE_MOBILE_REDIRECT="${ENABLE_MOBILE_REDIRECT}" \
  -e WITH_CREDENTIALS= \
  -e APP_ENV="${APP_ENV}" \
  -e APP_VERSION="${IMAGE_TAG}" \
  "${IMAGE_NAME}:${IMAGE_TAG}"

sleep "${HEALTHCHECK_DELAY_SECONDS:-3}"

curl -fsS "http://localhost:${HOST_PORT}/healthz" >/dev/null
curl -fsS "http://localhost:${HOST_PORT}/runtime-config.js" >/dev/null

echo "nuwax frontend is running: ${CONTAINER_NAME} -> http://localhost:${HOST_PORT}"
