# Phoenix AI Toolkit - Deployment Guide

## 🚀 Deployment URLs

- **Frontend (Vercel)**: https://phoenix.vercel.app
- **Backend (Render)**: https://phoenix.onrender.com

## 📦 Deployment Setup

### Frontend Deployment on Vercel

1. **Connect Repository to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub repository

2. **Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/dist`
   - Install Command: `cd client && npm install`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://phoenix.onrender.com/api
   ```

### Backend Deployment on Render

1. **Connect Repository to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New Web Service"
   - Connect GitHub repository

2. **Build Settings**:
   - Environment: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Root Directory: `server`

3. **Environment Variables**:
   Copy all variables from `server/.env.production` and update:
   ```
   NODE_ENV=production
   PORT=3000
   CORS_ORIGIN=https://phoenix.vercel.app
   ```

## 🔧 Development vs Production

### Development
- Client runs on: `http://localhost:5173`
- Server runs on: `http://localhost:3000`
- API calls use: `http://localhost:3000/api`

### Production
- Client runs on: `https://phoenix.vercel.app`
- Server runs on: `https://phoenix.onrender.com`
- API calls use: `https://phoenix.onrender.com/api`

## 📁 File Structure Changes

- ✅ All hardcoded localhost URLs replaced with environment variables
- ✅ Dynamic base URL configuration for client and server
- ✅ Production environment files created
- ✅ CORS configured for production domains
- ✅ Vercel.json configured for static deployment

## 🔄 Auto-Deployment

Both Vercel and Render will automatically deploy when you push to the main branch.

## 🚨 Important Notes

1. Make sure to update environment variables on both platforms
2. Database URL should point to production MongoDB instance
3. API keys should be production-ready
4. CORS is configured for both localhost (dev) and production domains
5. Image uploads will use Cloudinary in production for better performance

## 🧪 Testing

After deployment, test these endpoints:
- Frontend: https://phoenix.vercel.app
- Backend Health: https://phoenix.onrender.com/health
- API Status: https://phoenix.onrender.com/api/status
