# React Native App Setup Guide

This backend is designed for a **React Native CLI mobile app**. Follow this guide to connect your React Native app to this backend.

## 📱 Understanding the Architecture

```
React Native App (Frontend)
    ↓
    | HTTP Requests (axios/fetch)
    ↓
Express.js Backend (This API)
    ↓
PostgreSQL Database
```

**Key Points:**
- React Native apps **don't have CORS restrictions** like web browsers
- The app communicates directly with your backend API via HTTP
- Authentication uses JWT tokens stored securely on the device

## 🚀 Quick Start

### 1. Backend Setup (This Repository)

Make sure your backend is running:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server will run on http://localhost:8080
```

### 2. Connect Your React Native App

In your React Native project, configure the API base URL:

**For Development:**

```javascript
// config/api.js or constants.js
export const API_BASE_URL = Platform.select({
  // Use your computer's local IP, not localhost
  android: 'http://10.0.2.2:8080/api/v1',  // Android emulator
  ios: 'http://localhost:8080/api/v1',      // iOS simulator
  // For real devices: 'http://YOUR_COMPUTER_IP:8080/api/v1'
});
```

**Finding Your Computer's IP:**
```bash
# On macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig

# Example: http://192.168.1.100:8080/api/v1
```

**For Production:**
```javascript
export const API_BASE_URL = 'https://your-backend.render.com/api/v1';
```

### 3. Making API Requests

Install axios in your React Native project:

```bash
npm install axios
```

Create an API service:

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests automatically
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

// Handle token refresh on 401
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
          
          const { accessToken } = response.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          await AsyncStorage.clear();
          // Navigate to login screen
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 4. Example API Calls

```javascript
import api from './services/api';

// Get user profile
const getProfile = async () => {
  try {
    const response = await api.get('/users/me');
    console.log('Profile:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};

// Update profile
const updateProfile = async (data) => {
  try {
    const response = await api.put('/profiles/me', data);
    console.log('Updated:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};

// Upload photo
const uploadPhoto = async (imageUri) => {
  const formData = new FormData();
  formData.append('photo', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  });

  try {
    const response = await api.post('/upload/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Uploaded:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data?.message);
  }
};
```

## 🔐 Google OAuth Setup for React Native

### Step 1: Install Required Packages

```bash
npm install @react-native-google-signin/google-signin
```

### Step 2: Configure Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing one
3. Enable "Google+ API"

4. **Create OAuth 2.0 Client IDs:**

   **a) For Android:**
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Android"
   - Package name: `com.yourapp` (from `android/app/build.gradle`)
   - Get SHA-1 fingerprint:
     ```bash
     # Debug keystore
     cd android
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     
     # Copy the SHA1 value and paste in Google Console
     ```

   **b) For iOS:**
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "iOS"
   - Bundle ID: `com.yourapp` (from Xcode or `ios/YourApp.xcodeproj`)

   **c) For Backend Verification (Required):**
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Copy the Client ID → Use in backend `.env` as `GOOGLE_CLIENT_ID`

### Step 3: Configure in React Native

```javascript
// App.js or index.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From step 2c
  offlineAccess: true, // Required to get authorization code
  forceCodeForRefreshToken: true,
});
```

### Step 4: Implement Google Sign-In

```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import api from './services/api';

const signInWithGoogle = async () => {
  try {
    // 1. Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices();
    
    // 2. Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    
    // 3. Get authorization code
    const tokens = await GoogleSignin.getTokens();
    
    // 4. Send to backend
    const response = await api.post('/auth/google', {
      authorizationCode: tokens.serverAuthCode, // Use this for backend
      // OR use idToken if backend supports it
      idToken: userInfo.idToken,
    });
    
    // 5. Save tokens
    const { accessToken, refreshToken } = response.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    
    console.log('Logged in successfully!');
    
  } catch (error) {
    console.error('Google Sign-In Error:', error);
  }
};
```

## 📡 Real-time Features (Socket.io)

### Install Socket.io Client

```bash
npm install socket.io-client
```

### Setup Socket Connection

```javascript
// services/socket.js
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

let socket = null;

export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  
  socket = io(API_BASE_URL.replace('/api/v1', ''), {
    auth: { token },
    transports: ['websocket'],
  });
  
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  // Listen for messages
  socket.on('message:received', (message) => {
    console.log('New message:', message);
    // Update your UI
  });
  
  // Listen for notifications
  socket.on('notification:received', (notification) => {
    console.log('New notification:', notification);
    // Show notification to user
  });
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const sendMessage = (receiverId, content) => {
  if (socket) {
    socket.emit('message:send', { receiverId, content });
  }
};
```

## 🔔 Push Notifications (Firebase)

### Install Required Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### Configure Firebase

1. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
2. Follow setup: https://rnfirebase.io/

### Get FCM Token

```javascript
import messaging from '@react-native-firebase/messaging';
import api from './services/api';

const registerForPushNotifications = async () => {
  // Request permission
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    // Get FCM token
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    
    // Send to backend
    await api.post('/users/fcm-token', { token });
  }
};
```

## 🧪 Testing

### Test Backend Connection

```javascript
// Simple test
const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    console.log('Backend status:', data);
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
};
```

### Common Issues

**1. Cannot connect to localhost:**
- ❌ Don't use `localhost` or `127.0.0.1` on Android emulator
- ✅ Use `10.0.2.2` (Android emulator) or your computer's IP

**2. Network request failed:**
- Check if backend is running: `npm run dev`
- Check firewall settings
- For Android: Add to `AndroidManifest.xml`:
  ```xml
  <application
    android:usesCleartextTraffic="true">
  ```

**3. CORS errors:**
- React Native doesn't have CORS restrictions
- If you see CORS errors, it's likely a web browser testing issue

**4. Authentication fails:**
- Verify Google Client IDs match in both apps
- Check if tokens are being saved correctly
- Verify backend env vars are set

## 📦 Production Deployment

### Backend (Already covered in DEPLOYMENT_GUIDE.md)

### React Native App

**Android:**
```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

**iOS:**
```bash
cd ios
pod install
# Open in Xcode and archive
```

**Update API URL for production:**
```javascript
export const API_BASE_URL = 
  __DEV__ 
    ? 'http://10.0.2.2:8080/api/v1'  // Development
    : 'https://your-backend.render.com/api/v1';  // Production
```

## 📚 Useful Resources

- [React Native Docs](https://reactnavigation.org/)
- [Axios Docs](https://axios-http.com/docs/intro)
- [Socket.io Client Docs](https://socket.io/docs/v4/client-api/)
- [React Native Firebase](https://rnfirebase.io/)
- [Google Sign-In](https://github.com/react-native-google-signin/google-signin)

## 🆘 Need Help?

Common patterns are already implemented in this backend:
- ✅ JWT Authentication with refresh tokens
- ✅ File upload (multipart/form-data)
- ✅ Real-time messaging (Socket.io)
- ✅ Push notifications (FCM)
- ✅ Paginated lists
- ✅ Search and filters

Check the API routes in `src/routes/` for all available endpoints!
