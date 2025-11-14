# Google OAuth with react-native-inappbrowser-reborn

Complete guide for implementing Google OAuth in your React Native app using **InAppBrowser** instead of the native Google Sign-In SDK.

## 🎯 Why InAppBrowser?

- ✅ Works on both iOS and Android with same code
- ✅ No need for separate SHA-1 certificates or Bundle IDs
- ✅ No native SDK configuration needed
- ✅ Users see Google's official login page
- ✅ Easier to debug and maintain

## 📦 Setup

### 1. Install Package

```bash
npm install react-native-inappbrowser-reborn
```

### 2. Configure Google Cloud Console

Go to: https://console.cloud.google.com/apis/credentials

**Create OAuth 2.0 Client ID:**
- Application type: **Web application**
- Name: `Chhattisgarh Shadi Backend`

**Authorized redirect URIs:**

For development:
```
http://localhost:8080/api/v1/auth/google/callback
http://10.0.2.2:8080/api/v1/auth/google/callback
```

For production:
```
https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
```

**Important:** Copy the **Client ID** and **Client Secret** → Add to backend `.env`:
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### 3. Backend Environment Variables

**Development (.env):**
```env
NODE_ENV=development
PORT=8080  # ⚠️ IMPORTANT: Keep this port!

GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Production (Render.com):**
```env
PORT=10000  # Render automatically sets this - DON'T change it!

GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

> **⚠️ IMPORTANT ABOUT PORT:**
> - **Development:** Use `PORT=8080` (or any port you prefer)
> - **Production (Render):** Render sets `PORT` automatically (usually 10000)
> - **DO NOT** manually set PORT in Render's environment variables
> - Your app MUST listen on `process.env.PORT` (already configured in `server.js`)

## 💻 React Native Implementation

### Step 1: Create OAuth Config

```javascript
// config/auth.js
import { Platform } from 'react-native';

// Get backend URL based on environment
const getBackendUrl = () => {
  if (__DEV__) {
    // Development
    return Platform.select({
      android: 'http://10.0.2.2:8080',  // Android emulator
      ios: 'http://localhost:8080',     // iOS simulator
    });
  } else {
    // Production
    return 'https://chhattisgarhshadi-backend.onrender.com';
  }
};

export const API_BASE_URL = `${getBackendUrl()}/api/v1`;

export const GOOGLE_OAUTH_CONFIG = {
  clientId: 'your-client-id.apps.googleusercontent.com',
  redirectUrl: `${getBackendUrl()}/api/v1/auth/google/callback`,
  scopes: ['openid', 'profile', 'email'],
};
```

### Step 2: Implement Google Sign-In

```javascript
// services/authService.js
import InAppBrowser from 'react-native-inappbrowser-reborn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, GOOGLE_OAUTH_CONFIG } from '../config/auth';

export const signInWithGoogle = async () => {
  try {
    // 1. Build Google OAuth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_OAUTH_CONFIG.clientId}&` +
      `redirect_uri=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.redirectUrl)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.scopes.join(' '))}&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log('Opening Google OAuth URL:', authUrl);

    // 2. Check if InAppBrowser is available
    if (await InAppBrowser.isAvailable()) {
      
      // 3. Open InAppBrowser
      const result = await InAppBrowser.openAuth(
        authUrl,
        GOOGLE_OAUTH_CONFIG.redirectUrl,
        {
          // iOS options
          ephemeralWebSession: false,
          // Android options
          showTitle: false,
          enableUrlBarHiding: true,
          enableDefaultShare: false,
        }
      );

      console.log('InAppBrowser result:', result);

      // 4. Handle the callback
      if (result.type === 'success' && result.url) {
        // Extract authorization code from URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          // 5. Exchange code for tokens at backend
          const response = await axios.post(`${API_BASE_URL}/auth/google`, {
            authorizationCode: code,
            redirectUri: GOOGLE_OAUTH_CONFIG.redirectUrl,
          });

          // 6. Save tokens
          const { accessToken, refreshToken, user } = response.data;
          
          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          await AsyncStorage.setItem('user', JSON.stringify(user));

          console.log('✅ Login successful!');
          return { success: true, user };
        } else {
          throw new Error('No authorization code received');
        }
      } else {
        throw new Error('Authentication cancelled or failed');
      }

    } else {
      throw new Error('InAppBrowser is not available');
    }

  } catch (error) {
    console.error('Google Sign-In Error:', error);
    
    // Close the browser if still open
    if (await InAppBrowser.isAvailable()) {
      InAppBrowser.close();
    }
    
    return { success: false, error: error.message };
  }
};

export const signOut = async () => {
  try {
    await AsyncStorage.clear();
    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

### Step 3: Use in Your Component

```javascript
// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { signInWithGoogle } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        // Navigate to home screen
        navigation.replace('Home');
      } else {
        alert(`Login failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chhattisgarh Shadi</Text>
      
      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
```

## 🔧 Backend Implementation

Your backend already has the Google OAuth route. Just verify it's configured correctly:

```javascript
// src/routes/auth.routes.js
router.post('/google', validate(googleAuthSchema), googleAuth);

// src/controllers/auth.controller.js
export const googleAuth = asyncHandler(async (req, res) => {
  const { authorizationCode, redirectUri } = req.body;
  
  // Exchange code for tokens with Google
  // Verify user
  // Create/update user in database
  // Generate JWT tokens
  // Return to mobile app
  
  res.json({
    success: true,
    accessToken: 'jwt-access-token',
    refreshToken: 'jwt-refresh-token',
    user: { id, email, name, ... }
  });
});
```

## 🚀 Testing

### Development Testing

1. **Start backend:**
   ```bash
   npm run dev
   # Server running on http://localhost:8080
   ```

2. **Test from Android emulator:**
   - Make sure `API_BASE_URL` uses `http://10.0.2.2:8080/api/v1`
   - Click "Sign in with Google"
   - Should open Google login page in InAppBrowser

3. **Test from iOS simulator:**
   - Make sure `API_BASE_URL` uses `http://localhost:8080/api/v1`
   - Click "Sign in with Google"
   - Should open Google login page in InAppBrowser

4. **Test on real device:**
   - Find your computer's IP: `ifconfig` (Mac) or `ipconfig` (Windows)
   - Update `getBackendUrl()` to use your IP:
     ```javascript
     android: 'http://192.168.1.100:8080',
     ios: 'http://192.168.1.100:8080',
     ```
   - Make sure device and computer are on same WiFi

### Production Testing

1. **Deploy backend to Render** (see DEPLOYMENT_GUIDE.md)

2. **Update API_BASE_URL in app:**
   ```javascript
   return 'https://your-backend.render.com';
   ```

3. **Build and test:**
   ```bash
   # Android
   cd android && ./gradlew assembleRelease
   
   # iOS
   cd ios && pod install
   # Then build in Xcode
   ```

## 🐛 Troubleshooting

### Issue: "InAppBrowser is not available"

**Solution:** Make sure package is properly linked:
```bash
cd ios && pod install
npx react-native run-ios
```

### Issue: "redirect_uri_mismatch"

**Solution:** 
1. Check Google Cloud Console redirect URIs exactly match
2. Common mistake: Missing `/api/v1/auth/google/callback`
3. Make sure protocol is correct (http vs https)

### Issue: "Cannot connect to backend"

**Solution:**
- Android emulator: Use `10.0.2.2` NOT `localhost`
- iOS simulator: Use `localhost` is fine
- Real device: Use your computer's IP address
- Make sure backend is running!

### Issue: "No authorization code received"

**Solution:**
- User might have cancelled login
- Check if redirect URL is correct
- Check browser console for errors
- Make sure backend route is `/api/v1/auth/google/callback`

### Issue: PORT on Render

**Solution:**
- **DO NOT** set PORT in Render environment variables
- Render automatically sets it (usually 10000)
- Your `server.js` already uses `process.env.PORT`
- Just deploy and let Render handle it!

## 📝 Port Configuration Summary

### ✅ DO:
```env
# Development (.env file)
PORT=8080

# Your server.js (already configured)
const PORT = process.env.PORT || 8080;
```

### ❌ DON'T:
```env
# Production (Render) - DON'T set this manually!
# PORT=10000  ❌ Let Render set it automatically
```

### Why?
- **Development:** You control the port (8080)
- **Production:** Render controls the port (auto-assigned)
- Your server listens on `process.env.PORT` which works in both cases

## 🎉 That's It!

Your setup:
1. ✅ Backend runs on PORT 8080 (dev) or Render's auto port (prod)
2. ✅ React Native app uses InAppBrowser for Google OAuth
3. ✅ Backend verifies and exchanges tokens
4. ✅ App stores JWT tokens and user is logged in

No need for native SDK setup, SHA-1 certificates, or Bundle IDs! 🚀
