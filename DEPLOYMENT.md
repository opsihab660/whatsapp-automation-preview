# Deployment Guide

This guide explains how to deploy the WhatsApp Automation project with the backend on Render and the frontend on Vercel.

## Backend Deployment (Render)

### Prerequisites
1. Create a Render account at [render.com](https://render.com)
2. Connect your GitHub repository to Render

### Steps
1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Select the repository containing your project
   - Render will automatically detect the `render.yaml` file

2. **Set Environment Variables**
   Set the following environment variables in Render dashboard:
   ```
   MISTRAL_API_KEY=your_mistral_api_key_here
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   FRONTEND_URL=https://your-vercel-app-url.vercel.app
   ```

3. **Deploy**
   - Render will automatically build and deploy your backend
   - Your backend will be available at: `https://your-app-name.onrender.com`

### Important Notes
- The backend will be deployed from the `backend` directory
- Persistent storage is configured for WhatsApp sessions and database
- The service will automatically restart if it goes down

## Frontend Deployment (Vercel)

### Prerequisites
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`

### Steps
1. **Deploy to Vercel**
   ```bash
   cd frontend
   vercel
   ```

2. **Set Environment Variables**
   In Vercel dashboard, set:
   ```
   VITE_API_URL=https://your-render-app-name.onrender.com
   ```

3. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `frontend`

### Alternative: GitHub Integration
1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Set the environment variable `VITE_API_URL`
4. Deploy automatically on push

## Post-Deployment Configuration

### Update CORS Settings
After deploying both services, update the backend environment variable:
```
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

### Test the Deployment
1. Visit your Vercel frontend URL
2. Check that the frontend can connect to the backend
3. Test WhatsApp connection functionality
4. Verify WebSocket connections are working

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=10000
MISTRAL_API_KEY=your_mistral_api_key
MISTRAL_MODEL=mistral-large-latest
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
DB_PATH=./data/messages.db
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_AUTO_REPLY=true
LOG_LEVEL=info
LOG_FILE=./logs/app.log
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-render-app.onrender.com
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in backend
2. **WebSocket Connection Issues**: Check that both HTTP and WebSocket protocols are supported
3. **Environment Variables**: Verify all required environment variables are set
4. **Build Failures**: Check build logs for missing dependencies or configuration issues

### Logs
- **Render**: Check logs in Render dashboard
- **Vercel**: Check function logs in Vercel dashboard
- **Browser**: Check browser console for frontend errors

## Security Considerations
1. Use strong JWT secrets in production
2. Keep API keys secure and never commit them to version control
3. Enable HTTPS for all communications
4. Regularly update dependencies for security patches
