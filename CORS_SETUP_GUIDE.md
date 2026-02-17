# CORS Setup Guide

## Problem

The application is getting "Failed to fetch" errors when trying to communicate with the remote API at `https://helixgeneralhardware.com/api.php` from the frontend deployed on `fly.dev`.

**Root Cause**: Browser security policy (CORS - Cross-Origin Resource Sharing) blocks requests to the API unless the backend sends proper CORS headers.

---

## Solution: Configure CORS on Backend

The backend at `https://helixgeneralhardware.com/api.php` needs to respond with CORS headers to allow requests from the frontend.

### Required CORS Headers

Add these headers to **every response** from the API:

```
Access-Control-Allow-Origin: https://your-frontend-domain.fly.dev
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

### Implementation by Backend Technology

#### PHP Backend (api.php)

Add this to the top of `api.php` or in a middleware:

```php
<?php
// Enable CORS
header('Access-Control-Allow-Origin: *'); // Or specify domain: https://your-frontend.fly.dev
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Rest of API code...
```

#### Node.js/Express Backend

```javascript
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://your-frontend.fly.dev', // Or '*' for all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));
```

#### Python/Flask Backend

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

CORS(app, 
     origins=['https://your-frontend.fly.dev'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=True)
```

---

## Troubleshooting

### 1. "Failed to fetch" in Browser Console

**Check**:
- Is the API endpoint accessible directly? Try visiting `https://helixgeneralhardware.com/api.php?action=health` in your browser
- Are CORS headers present in the response? Open DevTools → Network tab → Check response headers
- Is the domain in `Access-Control-Allow-Origin` correct?

### 2. Preflight Request Fails (HTTP 403/405)

The browser sends an `OPTIONS` request before the actual request. Your backend must respond with HTTP 200 to OPTIONS requests.

**Check**:
- Ensure API handler processes `OPTIONS` requests
- Verify CORS headers are returned on OPTIONS responses

### 3. Credentials Not Sent

If the API needs authentication:
- Frontend is already sending: `credentials: 'include'`
- Backend must respond with: `Access-Control-Allow-Credentials: true`

---

## Temporary Workaround (If Backend Can't Change)

### Option 1: Use Browser Extension

Install a CORS extension temporarily (development only):
- **Allow CORS**: https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf

### Option 2: Use a Proxy Server

Configure Vite to proxy requests. The `vite.config.ts` already has some proxy setup, but you may need to adjust:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://helixgeneralhardware.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    }
  }
}
```

Then the frontend calls `http://localhost:8080/api/api.php` instead of the external API directly.

---

## Testing CORS Configuration

### Using curl

```bash
curl -i -X OPTIONS \
  -H "Origin: https://your-frontend.fly.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://helixgeneralhardware.com/api.php?action=login
```

Look for these headers in the response:
- `access-control-allow-origin`
- `access-control-allow-methods`
- `access-control-allow-headers`

### Using Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Make a request to the API
4. Click on the request
5. Go to Response Headers
6. Look for `access-control-*` headers

---

## Development Environment (localhost:8080)

The application uses a **Vite development proxy** to bypass CORS issues during development:

- Requests to `/api` are automatically proxied to the backend
- The proxy handles `changeOrigin: true` to modify the request origin
- This allows development to work even if the backend isn't CORS-configured

### How It Works

1. Frontend makes request to `http://localhost:8080/api`
2. Vite proxy intercepts and forwards to `https://helixgeneralhardware.com/api.php`
3. Response is returned to frontend without CORS blocking
4. Proxy is **only available in development** - doesn't work in production

---

## Production Environment

In production (deployed to fly.dev, netlify, vercel, etc.):

- The Vite proxy is **NOT available**
- Frontend must communicate directly with the backend API
- **Backend MUST have CORS headers configured** for production to work

### Required Production Fix

Contact your backend team and have them implement CORS headers as described in the "Solution: Configure CORS on Backend" section above.

---

## Checking CORS Configuration Status

### For Development (proxy enabled)

If you see CORS errors in development, the proxy might not be working:

1. Check that `npm run dev` is running
2. Check browser DevTools Network tab
3. Look for requests with `http://localhost:8080/api`
4. Check proxy logs in terminal for "Proxying:" messages

### For Production (no proxy)

Verify backend has CORS headers:

```bash
# Test the backend directly
curl -i -X OPTIONS \
  -H "Origin: https://your-frontend-domain.fly.dev" \
  -H "Access-Control-Request-Method: POST" \
  https://helixgeneralhardware.com/api.php?action=login

# Expected response headers:
# access-control-allow-origin: https://your-frontend-domain.fly.dev
# access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
# access-control-allow-headers: Content-Type, Authorization
```

---

## Backend Implementation Checklist

Your backend team should:

- [ ] Add CORS headers to all API responses
- [ ] Handle HTTP OPTIONS (preflight) requests with 200 status
- [ ] Include `Authorization` and `Content-Type` in allowed headers
- [ ] Set correct `Access-Control-Allow-Origin` (not just `*` for production)
- [ ] Enable `Access-Control-Allow-Credentials` if using cookies
- [ ] Test with curl or Postman before deploying

---

## Next Steps

1. **For Development**: No action needed - proxy handles CORS
2. **For Production**:
   - [ ] Contact Backend Team
   - [ ] Share this guide with them
   - [ ] Ask them to implement CORS headers
   - [ ] Test using curl command above
   - [ ] Verify in DevTools Network tab
   - [ ] Deploy and test in production

---

## Resources

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [MDN: CORS Errors](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors)
- [CORS Tester](https://www.webtoolkitservices.com/cors-checker)
- [Vite Proxy Documentation](https://vitejs.dev/config/server-options.html#server-proxy)
