# Deploying to Render

This guide will help you deploy both your backend and frontend to Render.com.

## Option 1: Using the Render Dashboard (Manual Setup)

### Step 1: Create a New Web Service

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub repository
4. Select the repository `remotebackend`

### Step 2: Configure the Web Service

Fill in the following information:
- **Name**: remotebackend (or your preferred name)
- **Environment**: Node
- **Region**: Choose the one closest to your users
- **Branch**: main (or your deployment branch)

### Step 3: Set the Build and Start Commands

- **Build Command**: `cd backend && npm install && cd ../frontend && npm install && npm run build && cd ..`
- **Start Command**: `cd backend && npm start`

### Step 4: Add Environment Variables

Click "Advanced" and add the following environment variables:
- `NODE_ENV`: `production`
- `PORT`: `8080` (Render will automatically use this)
- `GITHUB_TOKEN`: Your GitHub personal access token
- `REPO_OWNER`: `Nishantvidhuri`
- `REPO_NAME`: `suraj-remote`

### Step 5: Deploy

Click "Create Web Service" and wait for the deployment to complete. This may take a few minutes.

## Option 2: Using render.yaml (Blueprint)

We've included a `render.yaml` file in the repository to simplify deployment.

1. Log in to your [Render Dashboard](https://dashboard.render.com/)
2. Click "New" and select "Blueprint"
3. Connect your GitHub repository if not already connected
4. Select the repository `remotebackend`
5. Render will detect the `render.yaml` file and create the service as configured
6. Review the settings and click "Apply"
7. When prompted, enter your GitHub token
8. Wait for the deployment to complete

## Verifying Deployment

Once deployed, you should be able to access your application at the URL provided by Render (e.g., https://remotebackend.onrender.com).

## Troubleshooting

If you get the error `ENOENT: no such file or directory, stat '/opt/render/project/src/frontend/build/index.html'`:

1. Make sure the build command is executed successfully. Check the build logs.
2. Ensure your directory structure matches what's expected in `server.js`.
3. Try deploying again, or use the fixes we've implemented in this update.

## Update Netlify Frontend (If Using Separate Deployments)

If you're using Netlify for the frontend and Render for the backend only, update your Netlify environment variable:

- In the Netlify dashboard, go to Site settings → Build & deploy → Environment variables
- Update `REACT_APP_API_URL` to your Render URL (e.g., `https://remotebackend.onrender.com`)
- Redeploy your Netlify site 