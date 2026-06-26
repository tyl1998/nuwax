# Single-container runtime-config deployment

This document explains how to deploy the `nuwax` frontend as a **single container** and switch backend environments through runtime environment variables **without rebuilding the image**.

## When to use this

- The frontend runs as a standalone Nginx container
- The same image must be reused across dev / test / prod
- API / SSE endpoints should be injected at container startup

## How runtime config works

At container startup, `docker/entrypoint.sh` renders environment variables into `/usr/share/nginx/html/runtime-config.js`.

The frontend resolves config in this order:

1. `window.__NUWAX_RUNTIME_CONFIG__`
2. build-time `process.env.*`
3. in-code defaults

## Environment variables

| Variable | Purpose | Default | Notes |
| --- | --- | --- | --- |
| `BASE_URL` | Backend API base URL | empty | Page requests, downloads, exports, and the main SSE flows prefer this value |
| `WS_BASE_URL` | Reserved WS / SSE base URL | empty | Already rendered into runtime config for future reuse |
| `ROUTER_BASENAME` | Reserved sub-path deployment prefix | empty | Already rendered into runtime config |
| `PUBLIC_PATH` | Reserved static asset prefix | `/` | Already rendered into runtime config |
| `ENABLE_MOBILE_REDIRECT` | PC/H5 redirect switch | `true` | Read by the bootstrap script in `config/config.ts` |
| `WITH_CREDENTIALS` | Whether to explicitly send cookies/credentials | auto | When unset: cross-origin `BASE_URL` becomes `true`, same-origin/relative path stays `false` |
| `API_PROXY_URL` | Nginx `/api/` reverse proxy target | `http://host.docker.internal:8080` | When `BASE_URL` is empty, same-origin frontend `/api/**` requests are proxied to this target |
| `APP_ENV` | Environment label | empty | Useful for diagnostics or UI display |
| `APP_VERSION` | Version label | empty | Useful for diagnostics or UI display |

## Build the image

```bash
docker build -t nuwax-frontend:runtime-config .
```

## Run the container

```bash
docker run --rm -p 8080:80 \
  -e BASE_URL= \
  -e API_PROXY_URL=https://api.example.com \
  -e WS_BASE_URL=wss://api.example.com \
  -e APP_ENV=prod \
  -e APP_VERSION=1.1.12 \
  -e ENABLE_MOBILE_REDIRECT=true \
  nuwax-frontend:runtime-config
```

## Verify

### Health check

```bash
curl -i http://localhost:8080/healthz
```

Expected result: `200 OK` with body `ok`.

### Runtime config

```bash
curl -s http://localhost:8080/runtime-config.js
```

Confirm that `BASE_URL`, `APP_ENV`, and other values match the injected environment variables.

### Browser checks

1. Open `http://localhost:8080`
2. Run `window.__NUWAX_RUNTIME_CONFIG__` in the browser console
3. Inspect Network and confirm `/api/**`, page preview, export/download, and SSE traffic point at the injected `BASE_URL`
4. Refresh any SPA route and confirm it still falls back to `index.html` instead of returning 404
5. For standalone cross-origin backend deployments, confirm `getLoginInfo` and SSE requests now include cookies and stop bouncing back to login

## Kubernetes example

The repository includes an example file:

- `k8s/config/frontend-deployment.yaml`

It now contains:

- example `env` injection
- `/healthz` `readinessProbe`
- `/healthz` `livenessProbe`

## Rollback

1. Roll back to the previous frontend image
2. Keep the prior environment variable set
3. If troubleshooting is needed, compare `/usr/share/nginx/html/runtime-config.js` inside the container
