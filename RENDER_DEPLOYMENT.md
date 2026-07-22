# Render Deployment

## Service Settings

Create a Render **Node** web service with:

| Setting | Value |
| --- | --- |
| Build Command | `npm install && npm run build` |
| Start Command | `node server.js` |
| Node Version | `20` |

## Required Environment Variable

Configure this value in Render's service environment settings:

| Key | Value |
| --- | --- |
| `API_UPSTREAM_URL` | Existing PHP API endpoint, including `/api.php` |

`API_UPSTREAM_URL` is server-only. Do not use `VITE_EXTERNAL_API_URL`, and do not commit the upstream value, database credentials, or JWT secrets to the repository.

## How Requests Flow

The browser calls the deployed application's `/api.php` route. The Node server forwards that fixed route to `API_UPSTREAM_URL`, including the request method, query string, JSON body, content type, and authorization header. The upstream URL is never exposed to browser code, so no CORS configuration is required for application API calls.

## Post-deploy Verification

1. Request `/api.php?action=health` from the deployed application and confirm its status and response content match the API.
2. Load a nested app URL directly or refresh it to confirm SPA routing works.
3. Test a valid login, an invalid login, and an unavailable API. The unavailable API case should produce a generic service-connection message with retry/support guidance.
