# Deployment Guide

This application is a Single Page Application (SPA) that can be deployed to various hosting environments. This guide covers deployment configurations and environment variable setup for different hosting platforms.

## Overview

The application includes intelligent environment detection that automatically configures API routing based on where it's deployed:

- **Local/Apache Hosting**: Auto-detects private IP addresses, localhost, and .local domains. Automatically routes API calls through `/api.php` at the root.
- **Cloud Hosting (Render, etc.)**: Requires explicit `VITE_EXTERNAL_API_URL` configuration for external API communication.

## Environment Variables

### VITE_EXTERNAL_API_URL (Optional)

**Purpose**: Explicitly set the external API endpoint URL.

**When to use**:
- For cloud deployments (Render, Vercel, etc.)
- To override automatic detection
- When you need a specific API endpoint different from the default

**Format**: 
```
VITE_EXTERNAL_API_URL=https://api.example.com/api.php
```
or
```
VITE_EXTERNAL_API_URL=https://api.example.com
```
(The `/api.php` suffix is automatically added if missing)

**Default behavior**:
- If not set and hostname is local/private: Uses `/api.php` automatically
- If not set and hostname is cloud/external: Error (must set this variable)

## Deployment Scenarios

### 1. Render.com (or Similar Cloud Hosting)

The application includes a `Dockerfile` configured for cloud hosting:

**Key Features**:
- Multi-stage build for optimized image size
- Uses `serve` package with SPA mode (`-s dist -l 8080`)
- Automatically serves `index.html` for SPA routing

**Setup**:
1. Set environment variable during build/deployment:
   ```
   VITE_EXTERNAL_API_URL=https://your-api-domain.com/api.php
   ```

2. Render should automatically use the Dockerfile for deployment

3. Verify deployment:
   - Test refresh on nested routes (should not get 404)
   - Check browser console for environment detection logs

**Example Render Environment Variables**:
```
VITE_EXTERNAL_API_URL=https://helixgeneralhardware.com/api.php
```

### 2. Local Apache Hosting

For local network or private domain deployments using Apache:

**Setup**:
1. Deploy `dist/` folder to Apache DocumentRoot (e.g., `/var/www/html/`)

2. Copy `.htaccess.template` to the deployment directory:
   ```bash
   cp .htaccess.template dist/.htaccess
   ```

3. Ensure `/api.php` is available at the document root for API routing

4. Leave `VITE_EXTERNAL_API_URL` unset (environment detection will auto-detect)

5. Ensure Apache has `mod_rewrite` enabled:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

**Testing**:
- Navigate to your local domain (e.g., `http://localhost/` or `http://192.168.1.100/`)
- Refresh the page on nested routes - should work without 404
- Check browser console for "🏠 Local hosting detected" message

### 3. Localhost (Development Machine)

The application runs with SPA routing enabled by default in development:

**Setup**:
1. Run development server:
   ```bash
   npm run dev
   ```

2. Default configuration uses auto-detection

3. For testing with local API:
   ```bash
   VITE_USE_LOCAL_AUTH=true npm run dev
   ```

**Note**: Environment detection automatically recognizes `localhost` and `127.0.0.1`

## SPA Routing Configuration

### How It Works

The application prevents 404 errors on page refresh for nested routes through:

1. **Vite Dev Server**: Automatically serves `index.html` for non-file requests
2. **Production Build**: Configured in `vite.config.ts` for proper SPA structure
3. **Render/Cloud**: Uses `serve -s dist` which handles SPA routing
4. **Apache**: `.htaccess` file rewrites non-existent files to `index.html`

### Verification

After deployment, test these scenarios:

1. **Direct URL Navigation**:
   - Navigate to a nested route like `/dashboard/profile`
   - Should load without 404 error

2. **Page Refresh**:
   - Refresh page while on nested route
   - Should render the page correctly

3. **Browser Console**:
   - Check for environment detection messages:
     - `🏠 Local hosting detected` (Apache/localhost)
     - `🌐 Using explicit VITE_EXTERNAL_API_URL` (Cloud with config)

## Build Configuration

### Local Development Build
```bash
npm run build
```

### Development Mode Build
```bash
npm run build:dev
```

### Preview Built Application
```bash
npm run preview
```

## Environment Detection Debug Info

The application logs environment detection information to the browser console:

**Local Hosting Detection**:
```
📍 Environment Configuration: {
  apiBaseUrl: "http://192.168.1.100/api.php",
  isLocal: true,
  hostingType: "apache",
  hostname: "192.168.1.100",
  protocol: "http:",
  port: ""
}
```

**Cloud Hosting Detection**:
```
📍 Environment Configuration: {
  apiBaseUrl: "https://helixgeneralhardware.com/api.php",
  isLocal: false,
  hostingType: "cloud",
  hostname: "my-app.render.com",
  protocol: "https:",
  port: ""
}
```

## Troubleshooting

### 404 Errors on Page Refresh

**Problem**: Getting 404 when refreshing on nested routes

**Solutions**:
1. **Render**: Ensure Dockerfile is used (should use `serve -s dist`)
2. **Apache**: 
   - Verify `.htaccess` file exists in `dist/` directory
   - Ensure `mod_rewrite` is enabled
   - Check `RewriteBase` matches your deployment path
3. **Vite Dev**: Run `npm run dev` instead of manually serving `dist/`

### API Connection Errors

**Problem**: "Cloud hosting detected but VITE_EXTERNAL_API_URL is not configured"

**Solution**: 
1. Set `VITE_EXTERNAL_API_URL` environment variable
2. Ensure the API endpoint is reachable from the deployment location
3. Check CORS headers on the API if applicable

**Problem**: Using wrong API endpoint

**Solution**:
1. Check browser console for API endpoint being used
2. Verify environment detection correctly identified hosting type
3. For cloud: Explicitly set `VITE_EXTERNAL_API_URL` to correct endpoint

### CORS Issues

If you encounter CORS errors:

1. Verify API backend has proper CORS headers configured
2. For Render → External API: Ensure backend allows cross-origin requests
3. For Apache → `/api.php`: Ensure they're on same origin (no CORS needed)

## Advanced Configuration

### Custom Environment Detection

For special cases where auto-detection doesn't work, always use `VITE_EXTERNAL_API_URL`:

```
VITE_EXTERNAL_API_URL=https://your-custom-api-endpoint.com/api.php
```

This overrides all auto-detection logic.

### Private IP Ranges Detected Automatically

The following IP ranges are automatically detected as "local":
- `10.0.0.0/8` (10.0.0.0 - 10.255.255.255)
- `172.16.0.0/12` (172.16.0.0 - 172.31.255.255)  
- `192.168.0.0/16` (192.168.0.0 - 192.168.255.255)
- `127.0.0.0/8` (localhost)
- Domains ending in `.local`

## Deployment Checklist

### For Render (Cloud)
- [ ] `VITE_EXTERNAL_API_URL` environment variable is set
- [ ] Dockerfile is present and configured correctly
- [ ] API endpoint is reachable from Render
- [ ] Test page refresh on nested routes (should not 404)
- [ ] Check console logs for environment detection confirmation
- [ ] Verify CORS headers if API is on different origin

### For Apache (Local)
- [ ] `dist/` folder copied to DocumentRoot
- [ ] `.htaccess` file present in DocumentRoot
- [ ] Apache `mod_rewrite` is enabled
- [ ] `/api.php` endpoint is available at DocumentRoot
- [ ] Leave `VITE_EXTERNAL_API_URL` unset
- [ ] Test page refresh on nested routes (should not 404)
- [ ] Check console logs for "🏠 Local hosting detected"

## Quick Start Deployment Command

### Build for Production
```bash
npm run build
```

### Copy to Apache
```bash
cp .htaccess.template dist/.htaccess
# Then deploy dist/ folder to Apache DocumentRoot
```

### Deploy to Render
```bash
# Push code to git remote - Render will build and deploy automatically
git push origin main
```
