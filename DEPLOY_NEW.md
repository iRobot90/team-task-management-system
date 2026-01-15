# Deployment Guide: Vercel & Render (Free Tier)

This guide explains how to deploy the **Frontend** to Vercel and the **Backend** (+ Database) to Render.

## Prerequisites
1. GitHub Account.
2. Vercel Account (connected to GitHub).
3. Render Account (connected to GitHub).

## Configuration Generated
We have automatically created/updated the following configuration files for you:
- `render.yaml`: Defines the Backend and Database services for Render.
- `backend/build.sh`: Build script for the backend.
- `backend/requirements.txt`: Updated with production dependencies (`gunicorn`, `whitenoise`, `dj-database-url`).
- `backend/config/settings.py`: Updated to handle Render's Database URL and Static Files.
- `frontend/vercel.json`: Configuration for Vercel routing.

## Step 1: Push Code to GitHub
Ensure all your changes are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "Prepare for deployment to Render and Vercel"
git push origin main
```

## Step 2: Deploy Backend to Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub repository.
4. Render will detect `render.yaml`. Click **Apply** or **Create New Resources**.
5. Wait for the deployment to finish.
6. Once deployed, find the **Service URL** of your backend (e.g., `https://ttms-backend.onrender.com`).
   - **Note**: The database creation might take a moment.
   - **Important**: Render's *free* PostgreSQL has limits (e.g. expiry after 30-90 days). For a permanent free database, consider [Neon.tech](https://neon.tech) and provide the `DATABASE_URL` manually in Render's environment variables.

## Step 3: Deploy Frontend to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository.
4. **Configure Project**:
   - **Framework Preset**: Create React App (should be auto-detected).
   - **Root Directory**: Click `Edit` and select `frontend`.
   - **Build Command**: `npm run build` (default).
   - **Output Directory**: `build` (default).
   - **Environment Variables**:
     - Key: `REACT_APP_API_BASE_URL`
     - Value: `https://YOUR-RENDER-BACKEND-URL.onrender.com/api` (The URL from Step 2 + `/api`).
5. Click **Deploy**.

## Step 4: Final Configuration
1. Once Frontend is deployed, copy its URL (e.g., `https://your-frontend.vercel.app`).
2. Go back to **Render Dashboard** -> **ttms-backend** service -> **Environment**.
3. Add/Update the Environment Variable:
   - Key: `CORS_ALLOWED_ORIGINS`
   - Value: `https://your-frontend.vercel.app`
4. **Trigger a manual deploy** on Render if needed to pick up the new env var (usually happens automatically on save).

## Verification
- Visit your Vercel URL.
- Try logging in.
- If you see "Network Error", check the console and verify `CORS_ALLOWED_ORIGINS` on Render matches your Vercel domain exactly.
