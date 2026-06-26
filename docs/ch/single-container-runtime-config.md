# 单容器运行时配置部署

本文档说明如何将 `nuwax` 前端以**单容器**方式部署，并在**不重新构建镜像**的前提下，通过环境变量切换后端环境。

## 适用场景

- 前端以 Nginx 单容器独立部署
- 同一镜像需要发布到 dev / test / prod 多个环境
- 运行时通过容器环境变量注入 API / SSE 地址

## 运行时配置机制

容器启动时会执行 `docker/entrypoint.sh`，把环境变量渲染到 `/usr/share/nginx/html/runtime-config.js`。

前端运行时优先级如下：

1. `window.__NUWAX_RUNTIME_CONFIG__`
2. 构建期 `process.env.*`
3. 代码内默认值

## 环境变量

| 变量名 | 用途 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `BASE_URL` | 后端 API 基地址 | 空字符串 | 页面请求、下载、导出、SSE 主链路都会优先使用该值 |
| `WS_BASE_URL` | 预留的 WS / SSE 基地址 | 空字符串 | 已写入运行时配置，供后续链路复用 |
| `ROUTER_BASENAME` | 预留的子路径部署前缀 | 空字符串 | 已写入运行时配置 |
| `PUBLIC_PATH` | 预留的静态资源前缀 | `/` | 已写入运行时配置 |
| `ENABLE_MOBILE_REDIRECT` | PC/H5 自动跳转开关 | `true` | `config/config.ts` 中的首屏脚本会读取该值 |
| `WITH_CREDENTIALS` | 是否显式携带 Cookie/凭证 | 自动 | 未配置时：跨域 `BASE_URL` 自动为 `true`，同源/相对路径默认 `false` |
| `API_PROXY_URL` | Nginx `/api/` 反向代理目标 | `http://host.docker.internal:8080` | `BASE_URL` 为空时，前端同源 `/api/**` 请求会由 Nginx 转发到该地址 |
| `APP_ENV` | 环境标识 | 空字符串 | 可用于页面展示或问题排查 |
| `APP_VERSION` | 版本标识 | 空字符串 | 可用于页面展示或问题排查 |

## 构建镜像

```bash
docker build -t nuwax-frontend:runtime-config .
```

## 启动容器

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

## 验证

### 健康检查

```bash
curl -i http://localhost:8080/healthz
```

期望返回 `200 OK` 和 `ok`。

### 运行时配置

```bash
curl -s http://localhost:8080/runtime-config.js
```

确认 `BASE_URL`、`APP_ENV` 等值与容器环境变量一致。

### 浏览器验证

1. 打开 `http://localhost:8080`
2. 在控制台执行 `window.__NUWAX_RUNTIME_CONFIG__`
3. 查看 Network，确认 `/api/**`、页面预览、导出下载、SSE 请求都指向注入的 `BASE_URL`
4. 刷新任意前端路由，确认仍返回 `index.html` 而不是 404
5. 如果是独立域名访问后端，确认 `getLoginInfo`、SSE 请求已携带 Cookie，不再反复跳登录

## Kubernetes 示例

仓库已提供示例文件：

- `k8s/config/frontend-deployment.yaml`

该示例包含：

- `env` 注入样例
- `/healthz` 的 `readinessProbe`
- `/healthz` 的 `livenessProbe`

## 回滚

1. 回滚到上一版前端镜像
2. 保留原有环境变量配置
3. 如需临时排查，可直接对比容器中的 `/usr/share/nginx/html/runtime-config.js`
