# 🚀 Deploy to Render - Step-by-Step Guide

## Prerequisites
✅ GitHub account  
✅ Your code pushed to GitHub  
✅ Neon PostgreSQL database (you have this)  
✅ All credentials ready (Google OAuth, Razorpay, etc.)

---

## Step 1: Sign Up / Login to Render

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Choose **"Sign in with GitHub"** (easiest option)
4. Authorize Render to access your repositories

---

## Step 2: Create New Web Service

1. After login, click **"New +"** button (top right corner)
2. Select **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Click **"Next"**

---

## Step 3: Connect Your Repository

### If Repository is Visible:
- Find `chhattisgarhshadi-backend` in the list
- Click **"Connect"**

### If Repository Not Visible:
1. Click **"Configure account"** (GitHub icon)
2. Select repositories to grant access
3. Save, then click **"Connect"** on your repo

---

## Step 4: Configure Service Settings

Fill in these fields:

### Basic Settings:
- **Name:** `chhattisgarhshadi-backend` (or any name)
- **Region:** `Singapore` (closest to India)
- **Branch:** `main`
- **Root Directory:** Leave blank
- **Runtime:** Node (auto-detected)

### Build & Start Commands:
- **Build Command:**
  ```bash
  npm install && npx prisma generate
  ```

- **Start Command:**
  ```bash
  npm start
  ```

### Instance Type:
- **Plan:** Select **"Free"** (for testing)

---

## Step 5: Add Environment Variables

Click **"Advanced"** button, then scroll to **"Environment Variables"**

Click **"Add Environment Variable"** for each of these:

**⚠️ IMPORTANT:** Copy all actual values from your local `.env` file. The values below are placeholders.

### Server Configuration
```
NODE_ENV = production
PORT = 8080
```

### Database
```
DATABASE_URL = [Paste your Neon pooled connection URL from .env]
DIRECT_URL = [Paste your Neon direct connection URL from .env]
```

### JWT Secrets
```
JWT_ACCESS_SECRET = [Paste from your .env file]
JWT_REFRESH_SECRET = [Paste from your .env file]
JWT_ACCESS_EXPIRY = 15m
JWT_REFRESH_EXPIRY = 7d
```

### Google OAuth
```
GOOGLE_CLIENT_ID = [Paste from your .env file]
GOOGLE_CLIENT_SECRET = [Paste from your .env file]
```

### CORS
```
CORS_ORIGIN = *
```
(Change to your frontend domain later)

### Razorpay
```
RAZORPAY_KEY_ID = [Paste from your .env file]
RAZORPAY_KEY_SECRET = [Paste from your .env file]
RAZORPAY_WEBHOOK_SECRET = [Paste from your .env file]
```

### AWS S3
```
AWS_ACCESS_KEY_ID = [Paste from .env or use: dummy-key-for-testing]
AWS_SECRET_ACCESS_KEY = [Paste from .env or use: dummy-secret-for-testing]
AWS_REGION = ap-south-1
AWS_S3_BUCKET = [Paste from .env or use: dummy-bucket]
```

### MSG91 SMS
```
MSG91_AUTH_KEY = [Paste from .env or use: dummy-auth-key]
MSG91_SENDER_ID = [Paste from .env or use: CGSHAD]
MSG91_TEMPLATE_ID = [Paste from .env or use: dummy-template]
```

### Firebase (Optional)
```
FIREBASE_PROJECT_ID = [Paste from your .env file]
FIREBASE_CLIENT_EMAIL = [Paste from your .env file]
FIREBASE_PRIVATE_KEY = [Paste entire private key with line breaks]
```

---

## Step 6: Deploy!

1. After adding all environment variables, scroll down
2. Click **"Create Web Service"** button
3. Wait 2-5 minutes while Render:
   - Clones your repository
   - Installs dependencies
   - Generates Prisma client
   - Starts your server

Watch the build logs in real-time.

---

## Step 7: Verify Deployment

### Once Deployed:
- You'll see a green **"Live"** badge
- Your URL: `https://your-app-name.onrender.com`

### Test Your API:

**In Browser:**
```
https://your-app-name.onrender.com/api/v1/health
```

**Using curl:**
```bash
curl https://your-app-name.onrender.com/api/v1/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-11-14T..."
}
```

---

## Step 8: Post-Deployment

### Update CORS:
1. Go to **Environment** tab
2. Edit `CORS_ORIGIN`
3. Change from `*` to your frontend URL:
   ```
   CORS_ORIGIN = https://your-frontend-domain.com
   ```

### Add API URL:
```
API_URL = https://your-app-name.onrender.com
```

Service will auto-restart after changes.

---

## 🎯 Success Checklist

- ✅ Service shows "Live" (green badge)
- ✅ `/api/v1/health` returns 200 OK
- ✅ Logs show "Server is running"
- ✅ "Database connected successfully" in logs
- ✅ No errors in logs

---

## 🐛 Troubleshooting

### Build Failed
- Check **Logs** tab for errors
- Verify all environment variables are set
- Ensure `DATABASE_URL` is correct

### Service Crashes
- Check **Logs** for crash details
- Missing environment variables?
- Database connection issue?

### Cold Starts (Free Tier)
- Free apps sleep after 15 min inactivity
- First request takes ~30 seconds
- Normal behavior for free tier

---

## 💰 Free Tier Info

**Includes:**
- ✅ 750 hours/month
- ✅ WebSocket support (Socket.io works!)
- ✅ Auto-deploy from GitHub
- ✅ Free SSL
- ⚠️ Sleeps after 15 min inactivity

**Upgrade ($7/mo) for:**
- 24/7 uptime
- No cold starts
- More resources

---

## 🔄 Auto-Deploy

Render auto-deploys on git push:
1. Make code changes
2. `git push origin main`
3. Render auto-deploys
4. Watch logs in dashboard

---

## 📱 Update Frontend

In your frontend `.env`:
```
VITE_API_URL=https://your-app.onrender.com/api/v1
```
or
```
REACT_APP_API_URL=https://your-app.onrender.com/api/v1
```

---

## 🎉 You're Done!

Your backend is live at:
```
https://your-app-name.onrender.com
```

### Next Steps:
1. ✅ Test all endpoints
2. ✅ Update frontend with backend URL
3. ✅ Configure production OAuth
4. ✅ Set up S3 for uploads
5. ✅ Test end-to-end

**Happy deploying! 🚀**
