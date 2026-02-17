# Deploying to Render.com

This document explains how to deploy the medical management frontend to Render.com while keeping the API on helixgeneralhardware.com.

## Prerequisites

1. **Render.com Account**: Create a free account at https://render.com
2. **GitHub Repository**: Push your code to GitHub
3. **API Already Running**: helixgeneralhardware.com/api.php must be deployed and working

## Setup Steps

### Step 1: Push to GitHub

Make sure all your code (including the new `render.yaml` and `server.js` files) is pushed to GitHub:

```bash
git add .
git commit -m "Configure Render.com deployment"
git push origin main
```

### Step 2: Create Render.com Service

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect a repository"**
4. Select your GitHub repository (authorize if needed)
5. Choose the repository with this project

### Step 3: Configure the Web Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `medical-frontend` (or your preferred name) |
| **Environment** | `Node` |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your main branch) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node server.js` |
| **Plan** | Free (or paid if needed) |

### Step 4: Add Environment Variables

1. In the service settings, scroll to **"Environment"**
2. Add this environment variable:
   - **Key**: `VITE_EXTERNAL_API_URL`
   - **Value**: `https://helixgeneralhardware.com/api.php`

3. (Optional) Add Node.js version:
   - **Key**: `NODE_VERSION`
   - **Value**: `20`

### Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy your app
3. You'll get a URL like `https://medical-frontend.onrender.com`

---

## How It Works

- **Frontend**: Deployed on Render.com (renders the React app in the browser)
- **API**: Stays on helixgeneralhardware.com (handles all data operations)
- **Communication**: Frontend makes API calls to helixgeneralhardware.com/api.php

The `server.js` file serves the built React app and handles client-side routing (so `/login`, `/dashboard`, etc. all work correctly).

## Troubleshooting

### Build fails with "VITE_EXTERNAL_API_URL not found"

This is expected during build - the variable is set at runtime by Render.com. If it still fails:
1. Make sure the environment variable is set in Render service settings
2. Try redeploying by clicking **"Manual Deploy"** → **"Deploy latest commit"**

### Frontend can't reach the API

1. Check that `https://helixgeneralhardware.com/api.php?action=health` is accessible
2. Verify CORS headers are being sent from the API
3. Check browser console for error messages

### Blank page after deployment

1. Check the Render.com logs (click service → **"Logs"**)
2. Verify the build was successful
3. Try clearing browser cache and reloading

## Environment Variables

The following environment variables can be configured:

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_EXTERNAL_API_URL` | Backend API endpoint | `https://helixgeneralhardware.com/api.php` |
| `NODE_VERSION` | Node.js version to use | `20` |
| `PORT` | Port to listen on | `3000` (Render assigns automatically) |

## Custom Domain (Optional)

To use a custom domain instead of the onrender.com URL:

1. In Render service settings, scroll to **"Custom Domain"**
2. Enter your domain (e.g., `app.yourdomain.com`)
3. Follow Render's instructions to point your DNS to their nameservers

---

## Local Testing Before Deploy

To test the server locally:

```bash
npm run build
npm start
```

Then visit `http://localhost:3000` in your browser.

---

## Keeping Both Systems Running

Your setup now has:

✅ **Development**: Local machine with `npm run dev`
✅ **Staging**: helixgeneralhardware.com (current)
✅ **Production**: Render.com (new)

All can coexist and use the same API endpoint.
