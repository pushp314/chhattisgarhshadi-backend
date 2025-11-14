# 🚀 Quick Reference Guide - Chhattisgarh Shadi Backend

**Production URL:** `https://chhattisgarhshadi-backend.onrender.com`

**API Base URL:** `https://chhattisgarhshadi-backend.onrender.com/api/v1`

---

## 📖 Documentation Index

| Document | Purpose | Link |
|----------|---------|------|
| **API Documentation** | Complete API reference with all endpoints | [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) |
| **Google Cloud Setup** | Step-by-step Google OAuth configuration | [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md) |
| **React Native Setup** | Connect your React Native app | [REACT_NATIVE_SETUP.md](./REACT_NATIVE_SETUP.md) |
| **OAuth with InAppBrowser** | Mobile OAuth implementation guide | [GOOGLE_OAUTH_INAPPBROWSER.md](./GOOGLE_OAUTH_INAPPBROWSER.md) |
| **Deployment Guide** | Deploy to Render.com | [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) |

---

## ⚡ Quick Start

### 1. Check Backend Status

```bash
# Health check
curl https://chhattisgarhshadi-backend.onrender.com/api/v1/health

# Welcome message
curl https://chhattisgarhshadi-backend.onrender.com/
```

### 2. React Native App Setup

```bash
# Install dependencies
npm install axios react-native-inappbrowser-reborn socket.io-client @react-native-async-storage/async-storage

# iOS
cd ios && pod install && cd ..

# Run
npx react-native run-android  # or run-ios
```

### 3. API Configuration

```javascript
// config/auth.js
export const API_BASE_URL = 'https://chhattisgarhshadi-backend.onrender.com/api/v1';

export const GOOGLE_OAUTH_CONFIG = {
  clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
  redirectUrl: 'https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback',
  scopes: ['openid', 'profile', 'email'],
};
```

---

## 🔐 Google Cloud Console Configuration

### What You Need to Do

1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Create OAuth 2.0 Client ID** (Web application)
3. **Add Redirect URI:**
   ```
   https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
   ```
4. **Copy Client ID & Secret** and add to Render environment variables

**📖 Detailed Instructions:** [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)

---

## 🔑 Required Environment Variables

### On Render.com Dashboard

```env
# Database
DATABASE_URL=postgresql://...

# JWT Secrets
JWT_ACCESS_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-32-char-secret

# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret

# CORS
CORS_ORIGIN=*

# Node
NODE_ENV=production
```

### Optional Services (can be added later)

```env
# AWS S3 (file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket

# MSG91 (SMS)
MSG91_AUTH_KEY=your-key

# Razorpay (payments)
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret

# Firebase (push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_CLIENT_EMAIL=your-email
```

---

## 📡 API Endpoints Overview

### Authentication

```bash
POST /api/v1/auth/google          # Google OAuth login
POST /api/v1/auth/refresh         # Refresh token
POST /api/v1/auth/logout          # Logout
```

### Users

```bash
GET    /api/v1/users/me           # Get current user
PUT    /api/v1/users/me           # Update user
POST   /api/v1/users/phone/send-otp    # Send OTP
POST   /api/v1/users/phone/verify-otp  # Verify OTP
POST   /api/v1/users/fcm-token    # Register FCM token
DELETE /api/v1/users/me           # Delete account
```

### Profiles

```bash
GET    /api/v1/profiles/me        # Get my profile
POST   /api/v1/profiles/me        # Create profile
PUT    /api/v1/profiles/me        # Update profile
GET    /api/v1/profiles/:id       # Get profile by ID
POST   /api/v1/profiles/photos    # Upload photos
DELETE /api/v1/profiles/photos/:id # Delete photo
```

### Matches

```bash
GET  /api/v1/matches/             # Get recommendations
GET  /api/v1/matches/sent         # Sent requests
GET  /api/v1/matches/received     # Received requests
POST /api/v1/matches/:id/request  # Send request
PUT  /api/v1/matches/:id/accept   # Accept request
PUT  /api/v1/matches/:id/reject   # Reject request
```

### Messages

```bash
GET    /api/v1/messages/conversations        # All conversations
GET    /api/v1/messages/conversation/:userId # Messages with user
POST   /api/v1/messages/send                 # Send message
PUT    /api/v1/messages/:id/read             # Mark as read
DELETE /api/v1/messages/:id                  # Delete message
```

**📖 Full API Reference:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🧪 Testing Examples

### 1. Test Health Check

```bash
curl https://chhattisgarhshadi-backend.onrender.com/api/v1/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ API is healthy and running",
  "services": {
    "database": "✅ Connected",
    "socket": "✅ Running"
  }
}
```

### 2. Test Google Login (from React Native)

```javascript
import { signInWithGoogle } from './services/authService';

const handleLogin = async () => {
  const result = await signInWithGoogle();
  if (result.success) {
    console.log('Logged in:', result.user);
  }
};
```

### 3. Test Authenticated Request

```javascript
import api from './services/api';

const getProfile = async () => {
  const response = await api.get('/users/me');
  console.log('User:', response.data);
};
```

---

## 🔄 Real-time (Socket.io)

### Connect

```javascript
import io from 'socket.io-client';

const socket = io('https://chhattisgarhshadi-backend.onrender.com', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

### Listen for Events

```javascript
socket.on('message:received', (message) => {
  console.log('New message:', message);
});

socket.on('user:online', ({ userId }) => {
  console.log(`User ${userId} is online`);
});

socket.on('notification:received', (notification) => {
  console.log('New notification:', notification);
});
```

### Emit Events

```javascript
socket.emit('message:send', {
  receiverId: 'user-uuid',
  content: 'Hello!'
});
```

---

## 🐛 Common Issues & Solutions

### Issue: Cannot connect to backend from Android emulator

**Solution:** Use `http://10.0.2.2:8080` NOT `localhost`

```javascript
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8080/api/v1',
  ios: 'http://localhost:8080/api/v1',
});
```

### Issue: Google OAuth "redirect_uri_mismatch"

**Solution:** Make sure redirect URI in Google Console matches exactly:
```
https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
```

### Issue: 401 Unauthorized

**Solution:** Token expired. Use refresh token:

```javascript
const response = await axios.post('/auth/refresh', {
  refreshToken: await AsyncStorage.getItem('refreshToken')
});
```

### Issue: CORS error

**Solution:** React Native doesn't have CORS restrictions. If you see CORS errors, you're testing from a web browser. Test on mobile device/emulator instead.

### Issue: 503 Service Unavailable (File upload)

**Solution:** AWS S3 not configured. Add AWS credentials to Render environment variables or upload will fail.

---

## 📱 React Native Code Templates

### API Service Setup

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://chhattisgarhshadi-backend.onrender.com/api/v1',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Google Sign-In

```javascript
import InAppBrowser from 'react-native-inappbrowser-reborn';
import axios from 'axios';

const signIn = async () => {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?...';
  const result = await InAppBrowser.openAuth(authUrl, redirectUri);
  
  if (result.type === 'success') {
    const code = new URL(result.url).searchParams.get('code');
    const response = await axios.post('/auth/google', {
      authorizationCode: code,
      redirectUri,
    });
    
    const { accessToken, refreshToken } = response.data.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }
};
```

### Socket Connection

```javascript
import io from 'socket.io-client';

const connectSocket = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  const socket = io('https://chhattisgarhshadi-backend.onrender.com', {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
};
```

---

## 📊 Monitoring

### Check Backend Status

```bash
# Health check
curl https://chhattisgarhshadi-backend.onrender.com/api/v1/health

# Check services
curl https://chhattisgarhshadi-backend.onrender.com/ | json_pp
```

### View Render Logs

1. Go to https://dashboard.render.com/
2. Select your service
3. Click "Logs" tab
4. Monitor real-time logs

---

## 🎯 Next Steps

### For Development:

1. ✅ Backend is live at: `https://chhattisgarhshadi-backend.onrender.com`
2. 📖 Read: [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md) - Configure OAuth
3. 📱 Read: [REACT_NATIVE_SETUP.md](./REACT_NATIVE_SETUP.md) - Connect your app
4. 🔐 Set up Google OAuth Client ID
5. 💻 Implement login in your React Native app
6. 🧪 Test authentication flow

### For Production:

1. ✅ Backend deployed on Render
2. 🔑 Add all required environment variables
3. 🔐 Configure Google OAuth consent screen
4. 📸 Set up AWS S3 (optional, for image uploads)
5. 💳 Set up Razorpay (optional, for payments)
6. 📱 Set up Firebase FCM (optional, for push notifications)
7. 📤 Build and release your React Native app

---

## 📞 Support & Resources

- **API Docs:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Google Setup:** [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)
- **React Native:** [REACT_NATIVE_SETUP.md](./REACT_NATIVE_SETUP.md)
- **OAuth Guide:** [GOOGLE_OAUTH_INAPPBROWSER.md](./GOOGLE_OAUTH_INAPPBROWSER.md)
- **GitHub:** https://github.com/pushp314/chhattisgarhshadi-backend

---

## ✅ Development Checklist

### Backend Setup
- [x] Backend deployed to Render
- [x] Database connected (Neon PostgreSQL)
- [x] Health check working
- [ ] Google OAuth credentials configured
- [ ] AWS S3 configured (optional)
- [ ] Firebase FCM configured (optional)
- [ ] Razorpay configured (optional)

### Google Cloud Console
- [ ] Project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URIs added
- [ ] Client ID & Secret saved

### React Native App
- [ ] Dependencies installed
- [ ] API service configured
- [ ] Google OAuth implemented
- [ ] Authentication flow working
- [ ] Socket.io connected
- [ ] Push notifications configured (optional)

---

**Last Updated:** November 14, 2025

**Production URL:** https://chhattisgarhshadi-backend.onrender.com
