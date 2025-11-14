# 🎯 IMMEDIATE ACTION ITEMS - Start Here!

**Backend is LIVE:** `https://chhattisgarhshadi-backend.onrender.com` ✅

This document tells you **exactly what to do next** to connect your React Native app.

---

## ✅ What's Already Done

- ✅ Backend deployed to Render
- ✅ Database connected and working
- ✅ All API endpoints ready
- ✅ Socket.io real-time messaging configured
- ✅ Documentation complete

---

## 🚨 WHAT YOU NEED TO DO NOW

### Step 1: Google Cloud Console Setup (15 minutes)

**Why?** Your app needs Google OAuth credentials to allow users to login.

**Action:** Follow this guide: [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)

**Quick Steps:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application type)
3. Add redirect URI: `https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback`
4. Copy Client ID and Secret
5. Add to Render environment variables:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   ```

**Result:** Users can login with Google ✅

---

### Step 2: Update React Native App (30 minutes)

**Why?** Your app needs to point to the production backend.

**Action:** Follow this guide: [REACT_NATIVE_SETUP.md](./REACT_NATIVE_SETUP.md)

**Quick Steps:**

#### 2.1 Install Dependencies

```bash
cd your-react-native-app
npm install axios react-native-inappbrowser-reborn socket.io-client @react-native-async-storage/async-storage
```

#### 2.2 Create API Configuration

Create file: `config/auth.js`

```javascript
import { Platform } from 'react-native';

const getBackendUrl = () => {
  if (__DEV__) {
    // Development - test with local backend
    return Platform.select({
      android: 'http://10.0.2.2:8080',
      ios: 'http://localhost:8080',
    });
  } else {
    // Production - use Render URL
    return 'https://chhattisgarhshadi-backend.onrender.com';
  }
};

export const API_BASE_URL = `${getBackendUrl()}/api/v1`;

export const GOOGLE_OAUTH_CONFIG = {
  // IMPORTANT: Replace with YOUR Client ID from Google Cloud Console
  clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
  redirectUrl: `${getBackendUrl()}/api/v1/auth/google/callback`,
  scopes: ['openid', 'profile', 'email'],
};
```

#### 2.3 Create API Service

Create file: `services/api.js`

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          await AsyncStorage.clear();
          // Navigate to login
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

#### 2.4 Implement Google Sign-In

Create file: `services/authService.js`

```javascript
import InAppBrowser from 'react-native-inappbrowser-reborn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, GOOGLE_OAUTH_CONFIG } from '../config/auth';

export const signInWithGoogle = async () => {
  try {
    // Build Google OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_OAUTH_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.redirectUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent`;

    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.openAuth(
        authUrl,
        GOOGLE_OAUTH_CONFIG.redirectUrl,
        {
          ephemeralWebSession: false,
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        }
      );

      if (result.type === 'success' && result.url) {
        const code = new URL(result.url).searchParams.get('code');

        if (code) {
          // Exchange code for tokens
          const response = await axios.post(`${API_BASE_URL}/auth/google`, {
            authorizationCode: code,
            redirectUri: GOOGLE_OAUTH_CONFIG.redirectUrl,
          });

          // Save tokens
          const { accessToken, refreshToken, user } = response.data.data;
          
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          await AsyncStorage.setItem('user', JSON.stringify(user));

          return { success: true, user };
        }
      }
    }
    
    throw new Error('Authentication failed');
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    if (await InAppBrowser.isAvailable()) {
      InAppBrowser.close();
    }
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  await AsyncStorage.clear();
};
```

#### 2.5 Use in Login Screen

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { signInWithGoogle } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);
    
    if (result.success) {
      navigation.replace('Home');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <View>
      <Text>Chhattisgarh Shadi</Text>
      <TouchableOpacity onPress={handleGoogleSignIn} disabled={loading}>
        <Text>Sign in with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
```

**Result:** Your app can now authenticate users! ✅

---

## 🧪 Testing

### Test 1: Check Backend is Working

Open in browser:
```
https://chhattisgarhshadi-backend.onrender.com/api/v1/health
```

**Expected:** JSON response with "✅ API is healthy and running"

### Test 2: Test from React Native

```bash
# Start your React Native app
npx react-native run-android  # or run-ios

# Try to login with Google
# Should open InAppBrowser → Google login → Success!
```

---

## 📋 Environment Variables Needed on Render

Go to: https://dashboard.render.com/ → Your service → Environment

**Currently Set:**
- ✅ `DATABASE_URL`
- ✅ `JWT_ACCESS_SECRET`
- ✅ `JWT_REFRESH_SECRET`
- ✅ `CORS_ORIGIN`
- ✅ `NODE_ENV`

**You Need to Add:**
- ❌ `GOOGLE_CLIENT_ID` - Get from Google Cloud Console
- ❌ `GOOGLE_CLIENT_SECRET` - Get from Google Cloud Console

**Optional (add later):**
- `AWS_ACCESS_KEY_ID` - For file uploads
- `AWS_SECRET_ACCESS_KEY` - For file uploads
- `AWS_REGION` - For file uploads
- `AWS_S3_BUCKET` - For file uploads
- `MSG91_AUTH_KEY` - For SMS OTP
- `RAZORPAY_KEY_ID` - For payments
- `RAZORPAY_KEY_SECRET` - For payments
- `FIREBASE_PROJECT_ID` - For push notifications
- `FIREBASE_PRIVATE_KEY` - For push notifications
- `FIREBASE_CLIENT_EMAIL` - For push notifications

---

## 🎯 Summary: What You're Building

```
User opens app
    ↓
Clicks "Sign in with Google"
    ↓
InAppBrowser opens → Google login page
    ↓
User enters credentials
    ↓
Google redirects to: https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
    ↓
Backend exchanges code for tokens
    ↓
Returns JWT tokens to app
    ↓
App stores tokens
    ↓
User is logged in! ✅
```

---

## 📚 Full Documentation

- **📖 [API Documentation](./API_DOCUMENTATION.md)** - All API endpoints
- **🔐 [Google Cloud Setup](./GOOGLE_CLOUD_SETUP.md)** - Step-by-step OAuth config
- **📱 [React Native Setup](./REACT_NATIVE_SETUP.md)** - Complete integration guide
- **🚀 [Quick Reference](./QUICK_REFERENCE.md)** - Quick examples and snippets

---

## 🆘 Common Issues

### Issue: "Cannot connect to backend from Android"

**Solution:** Use `http://10.0.2.2:8080` NOT `localhost`:

```javascript
android: 'http://10.0.2.2:8080',
```

### Issue: "redirect_uri_mismatch"

**Solution:** Make sure redirect URI in Google Console is EXACTLY:
```
https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
```

### Issue: "invalid_client"

**Solution:** 
1. Check Client ID in `config/auth.js` matches Google Console
2. Check Client Secret in Render environment variables matches Google Console
3. Make sure there are no extra spaces or quotes

---

## ✅ Checklist

### Backend (Render)
- [x] Deployed to Render
- [x] Database connected
- [x] Health check working
- [ ] Google OAuth credentials added (YOU NEED TO DO THIS)

### Google Cloud Console
- [ ] Project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URI added
- [ ] Client ID & Secret copied

### React Native App
- [ ] Dependencies installed
- [ ] `config/auth.js` created with YOUR Client ID
- [ ] `services/api.js` created
- [ ] `services/authService.js` created
- [ ] Login screen implemented
- [ ] Tested on emulator/device

---

## 🚀 Ready to Start?

1. **First:** Do Google Cloud Console setup (15 min)
2. **Then:** Update your React Native app (30 min)
3. **Test:** Try logging in!

**Good luck! 🎉**

---

**Need Help?**
- Read: [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)
- Read: [REACT_NATIVE_SETUP.md](./REACT_NATIVE_SETUP.md)
- Check: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
