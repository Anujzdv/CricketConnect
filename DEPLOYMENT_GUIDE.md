# 🚀 Free Deployment Guide: Vercel + Render

This guide walks you through deploying CricketConnect for **100% free** using:
- **Render.com** (Free Web Service for Node.js API & WebSockets)
- **Vercel.com** (Free Global CDN for React Frontend)

---

## Part 1: Push Code to GitHub

1. If you haven't initialized Git yet:
   ```bash
   git init
   git add .
   git commit -m "feat: complete CricketConnect platform ready for deployment"
   ```
2. Create a new repository on [GitHub](https://github.com/new).
3. Link and push your repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/cricketconnect.git
   git branch -M main
   git push -u origin main
   ```

---

## Part 2: Deploy Backend on Render (Free)

1. Go to [Render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Fill in the following settings:
   - **Name**: `cricketconnect-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `any_random_secure_string_here`
   - *(Optional)* `DATABASE_URL`: *(Leave blank to use the built-in zero-config store, or paste a free PostgreSQL URL from [Neon.tech](https://neon.tech) / [Supabase.com](https://supabase.com))*
6. Click **Create Web Service**.
7. Once deployed, copy your Render URL:
   `https://cricketconnect-api.onrender.com`

---

## Part 3: Deploy Frontend on Vercel (Free)

1. Go to [Vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`
5. Expand **Environment Variables** and add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://cricketconnect-api.onrender.com/api` *(Your Render backend URL followed by `/api`)*
6. Click **Deploy**.
7. In ~60 seconds, your site will be live at `https://your-project.vercel.app`!

---

## 🎯 Verification Checklist

- [x] Responsive Light/Dark theme with high-contrast text
- [x] Ground browsing and slot booking
- [x] Match creation and squad joining
- [x] Real-time live score updates via WebSockets
- [x] Automatic fallback store for immediate functionality without DB setup
