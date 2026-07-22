# Deployment Guide

## Same-Origin API Model

The browser always sends application API requests to the relative endpoint `/api.php`. In Node deployments, `server.js` relays only that fixed route to the configured upstream API. This keeps the upstream URL and any backend credentials out of the frontend bundle and avoids browser CORS dependencies.

## Required Runtime Configuration

Set the following server-only environment variable in Render, Fly, or another Node host:

```text
API_UPSTREAM_URL=https://your-api-domain.example/api.php
```

Do not use a `VITE_` prefix for this value. Do not place database credentials, JWT secrets, or API credentials in frontend environment variables or project files.

For local development, run `npm run dev-full`. With `VITE_USE_LOCAL_AUTH=true`, Vite proxies `/api.php` to the local auth service. Otherwise Vite proxies the same route to `API_UPSTREAM_URL`.

## Node Deployments

Render uses `node server.js`. The Docker image also runs `server.js` and listens on the platform-provided `PORT` (Fly is configured for port 8080). Static assets and SPA deep links are served by the same Node process after the proxy route.

## Verification

1. Open `/api.php?action=health` through the deployed application and confirm the upstream health response is returned.
2. Refresh a nested application route and confirm the SPA loads.
3. Sign in with valid credentials and confirm the request succeeds without a browser CORS error.
4. Check invalid credentials still show the normal authentication message.
5. Temporarily use an unreachable `API_UPSTREAM_URL` in a non-production environment and confirm `/api.php` returns the generic 502 service response without upstream details.

## Apache Hosting

If the PHP API is colocated with an Apache deployment, expose `api.php` at the same document root as the app. The browser still calls only `/api.php`.
