#!/bin/sh
set -eu

TEMPLATE_PATH="/usr/share/nginx/html/runtime-config.template.js"
OUTPUT_PATH="/usr/share/nginx/html/runtime-config.js"

export BASE_URL="${BASE_URL:-}"
export WS_BASE_URL="${WS_BASE_URL:-}"
export ROUTER_BASENAME="${ROUTER_BASENAME:-}"
export PUBLIC_PATH="${PUBLIC_PATH:-/}"
export ENABLE_MOBILE_REDIRECT="${ENABLE_MOBILE_REDIRECT:-true}"
export WITH_CREDENTIALS="${WITH_CREDENTIALS:-}"
export APP_ENV="${APP_ENV:-}"
export APP_VERSION="${APP_VERSION:-}"

if [ -f "$TEMPLATE_PATH" ]; then
  envsubst '${BASE_URL} ${WS_BASE_URL} ${ROUTER_BASENAME} ${PUBLIC_PATH} ${ENABLE_MOBILE_REDIRECT} ${WITH_CREDENTIALS} ${APP_ENV} ${APP_VERSION}' < "$TEMPLATE_PATH" > "$OUTPUT_PATH"
fi