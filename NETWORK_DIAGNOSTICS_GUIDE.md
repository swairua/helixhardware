# Network Diagnostics & Troubleshooting Guide

## Overview

The application now includes a comprehensive **Network Diagnostics Tool** to help identify and resolve connectivity issues with the `helixgeneralhardware.com` API server.

## Quick Access

1. **From Login Page**: Click the **"Network Diagnostics"** button at the bottom of the login form
2. **Direct URL**: Navigate to `http://localhost:8080/debug/network` (development) or `/debug/network` (production)

## What The Tool Tests

The Network Diagnostics panel runs the following tests:

### 1. **DNS Resolution**
- Tests if the domain `helixgeneralhardware.com` can be resolved to an IP address
- Uses public DNS API (dns.google)
- **Common Issue**: If this fails, your DNS server may be misconfigured or blocked

### 2. **Direct Connectivity**
- Tests if you can reach the API server directly
- Measures response time
- **Common Issue**: Firewall or corporate proxy blocking HTTPS (port 443)

### 3. **CORS Configuration**
- Checks if the API server has proper CORS headers configured
- Tests if your origin is allowed
- **Common Issue**: Backend missing CORS headers for production deployments

### 4. **Proxy Detection**
- Identifies if your request is going through a proxy
- Shows proxy headers if detected
- **Common Issue**: Corporate proxy interfering with SSL/TLS

### 5. **Dev Proxy Connectivity** (Development Only)
- Tests if the Vite development proxy is working
- Only runs when `npm run dev` is active
- **Common Issue**: Dev server not running or misconfigured

## Understanding The Results

### Status Indicators

- **✅ Success**: Test passed, no issues detected
- **⚠️ Warning**: Test passed but with caveats or unexpected configuration
- **❌ Error**: Test failed, indicates a problem
- **ℹ️ Info**: Additional information about the connection

### Summary Dashboard

The diagnostics display a summary count:
- **Green box**: Number of passing tests
- **Yellow box**: Number of warnings
- **Red box**: Number of errors

## Common Issues & Solutions

### 🔴 **DNS Resolution Failed**

**Error Message**: "Failed to resolve helixgeneralhardware.com"

**Causes**:
- Incorrect domain name
- DNS server is down
- Corporate firewall blocking DNS queries

**Solutions**:
```bash
# Windows - Flush DNS cache
ipconfig /flushdns

# Mac - Flush DNS cache
sudo dscacheutil -flushcache

# Test DNS manually
nslookup helixgeneralhardware.com

# Use public DNS
# Change system DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)
```

### 🔴 **Connection Timeout (10 seconds)**

**Error Message**: "Connection timeout after 10 seconds"

**Causes**:
- API server is slow or overloaded
- Network latency is high
- Firewall blocking the connection

**Solutions**:
1. Check if `helixgeneralhardware.com` is online
2. Try accessing from a different network (mobile hotspot)
3. Contact your network administrator about bandwidth restrictions
4. Check server status with your hosting provider

### 🔴 **Connection Refused**

**Error Message**: "Connection refused - server is not listening"

**Causes**:
- API server is down
- Port 443 is not open
- Firewall completely blocking outbound HTTPS

**Solutions**:
1. Verify API server is running
2. Check firewall rules allow HTTPS (port 443) to helixgeneralhardware.com
3. Verify domain is correct: `helixgeneralhardware.com`
4. Test with: `curl -I https://helixgeneralhardware.com`

### 🔴 **Network Error (Failed to fetch)**

**Error Message**: "Connection failed - likely CORS, firewall, or DNS issue"

**Causes**:
- CORS headers not configured on backend
- Corporate firewall intercepting HTTPS
- VPN or proxy interference

**Solutions**:
1. In **development**: This is normal, use Vite proxy (automatic)
2. In **production**: Backend must add CORS headers:
   ```php
   header('Access-Control-Allow-Origin: *');
   header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
   header('Access-Control-Allow-Headers: Content-Type, Authorization');
   ```
3. Contact backend team if needed

### 🟡 **CORS Headers Missing**

**Warning Message**: "CORS headers not found - backend may not have CORS configured"

**When It Matters**:
- **In Development**: Vite proxy bypasses this (not a problem)
- **In Production**: This WILL cause failures

**Solution**:
Backend must be configured with CORS headers (see above)

### 🟡 **Request Going Through Proxy**

**Info Message**: "Request appears to be going through a proxy"

**What It Means**:
- Your request is being proxied (e.g., corporate proxy)
- This is normal in corporate environments

**Solutions**:
1. Verify proxy allows HTTPS to `helixgeneralhardware.com`
2. Check if proxy needs authentication
3. Test without proxy if possible (mobile hotspot)

## Firewall & Proxy Troubleshooting

### For Corporate Networks

If you're behind a corporate firewall/proxy:

1. **Contact IT Department** and ask them to allow:
   - Domain: `helixgeneralhardware.com`
   - Port: `443` (HTTPS)
   - Protocol: TLS/SSL

2. **Check Proxy Settings**:
   - Windows: Settings → Network & Internet → Proxy
   - Mac: System Preferences → Network → Advanced → Proxies
   - Browser-specific proxy settings

3. **Test Without Proxy** (if possible):
   - Try from mobile hotspot
   - Try from home network
   - Try from coffee shop WiFi

### For Home/Small Networks

1. **Check Router Firewall**:
   - Admin panel: Usually `192.168.1.1` or `192.168.0.1`
   - Look for URL filtering or outbound rules
   - Whitelist `helixgeneralhardware.com`

2. **Check Windows Firewall**:
   ```bash
   # Run as Administrator
   netsh advfirewall show allprofiles
   ```

3. **Check Mac Firewall**:
   - System Preferences → Security & Privacy → Firewall Options

## Testing The API Directly

To test if the API is truly accessible:

```bash
# Test basic connectivity
curl -I https://helixgeneralhardware.com

# Test health endpoint
curl https://helixgeneralhardware.com/api.php?action=health

# Test with verbose output
curl -v https://helixgeneralhardware.com/api.php?action=health
```

## Development vs Production

### Development (npm run dev)

- Vite proxy automatically bypasses CORS issues
- Tests may show CORS warnings (normal, expected)
- Dev proxy connectivity test should pass

**If dev proxy fails**:
```bash
# Restart dev server
npm run dev
```

### Production (Deployed)

- No proxy available
- **Backend MUST have CORS headers configured**
- All connectivity must be direct

**If production fails**:
1. Verify backend has CORS headers
2. Contact backend team
3. Check DNS propagation for domain

## Generating & Sharing Diagnostic Reports

1. Run diagnostics
2. Click **"Copy Full Report to Clipboard"**
3. Share with your system administrator or IT team
4. Include this information:
   - Full diagnostic report
   - Your network environment (corporate, home, mobile)
   - Browser version
   - Operating system

## Development Tips

### Enable Debug Logging

To see detailed API proxy logs in console:

```bash
# The dev server automatically logs all proxy activity
# Watch terminal when running: npm run dev
```

You'll see messages like:
```
📡 Proxying: POST /api?action=health
✅ Response: 200
```

### Check Network Tab in Browser DevTools

1. Press **F12** to open DevTools
2. Go to **Network** tab
3. Try to login
4. Look at failed requests
5. Check response headers for:
   - `content-type`
   - `access-control-allow-origin`
   - HTTP status code

## Environment Configuration

The app uses this environment variable:

```bash
VITE_EXTERNAL_API_URL=https://helixgeneralhardware.com/api.php
```

To override (development only):

```bash
# Use custom API endpoint
VITE_EXTERNAL_API_URL=https://your-api.com npm run dev

# Use local development server
npm run dev:local
```

## Getting Help

If diagnostics don't solve the issue:

1. **Gather Information**:
   - Run diagnostics and copy report
   - Note exact error message
   - Screenshot of the error
   - Your network setup (corporate/home/mobile)

2. **Contact Support**:
   - Provide diagnostic report
   - Include browser console errors
   - Describe when issue started
   - List any network changes

3. **Check Browser Console**:
   - Press F12
   - Go to Console tab
   - Look for red error messages
   - Copy full error text

## Quick Reference Card

| Issue | Test | Solution |
|-------|------|----------|
| Can't resolve domain | DNS Resolution | Flush DNS cache, use public DNS |
| API unreachable | Direct Connectivity | Check firewall, verify domain |
| Login works but errors after | Proxy Detection | Check corporate proxy settings |
| Production doesn't work | CORS Configuration | Add CORS headers to backend |
| Dev mode has issues | Dev Proxy Connectivity | Restart: `npm run dev` |
| Very slow | Direct Connectivity | Check internet speed, server load |

## Advanced Troubleshooting

### Using curl to Test Each Step

```bash
# 1. Test DNS
nslookup helixgeneralhardware.com

# 2. Test TCP connection
curl -v https://helixgeneralhardware.com

# 3. Test API health
curl https://helixgeneralhardware.com/api.php?action=health

# 4. Test with headers
curl -H "Content-Type: application/json" \
  https://helixgeneralhardware.com/api.php?action=health

# 5. Test with credentials
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://helixgeneralhardware.com/api.php?action=health
```

### Packet Analysis (Advanced)

For network administrators:

```bash
# Capture HTTPS traffic to the domain
tcpdump -i any -n "host helixgeneralhardware.com"

# Or use Wireshark GUI for visual analysis
```

## Performance Metrics

The diagnostics tool measures:

- **Response Time**: How long API takes to respond
- **Status Codes**: HTTP status (200, 403, 404, 500, etc.)
- **Header Information**: CORS, server type, etc.

**Healthy Response**:
- Response time: < 1000ms (ideally < 500ms)
- Status: 200 or 201
- CORS headers: Present in production

**Slow Response**:
- Response time: > 5000ms
- Check server load, network latency

**Error Response**:
- Status: 403 (Forbidden), 404 (Not Found), 500 (Server Error)
- Check logs for details

---

**Last Updated**: January 2026  
**API Domain**: helixgeneralhardware.com  
**Dev Server**: http://localhost:8080
