# Google Cloud Console Setup Guide

Complete step-by-step guide to configure Google OAuth for the Chhattisgarh Shadi mobile app using InAppBrowser.

---

## 📋 Prerequisites

- Google account
- Backend deployed at: `https://chhattisgarhshadi-backend.onrender.com`
- React Native app with `react-native-inappbrowser-reborn` installed

---

## 🚀 Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### 1.2 Create New Project

1. Click the **project dropdown** at the top
2. Click **"NEW PROJECT"**
3. Enter project details:
   - **Project name:** `Chhattisgarh Shadi`
   - **Organization:** (leave as default)
4. Click **"CREATE"**

### 1.3 Select Your Project

Once created, make sure your project is selected in the dropdown at the top.

---

## 🔑 Step 2: Enable Required APIs

### 2.1 Enable Google+ API

1. Go to: https://console.cloud.google.com/apis/library
2. Search for **"Google+ API"** (or **"People API"**)
3. Click on it
4. Click **"ENABLE"**

### 2.2 Enable OAuth Consent Screen API

This should be enabled automatically, but verify it's active.

---

## 🎨 Step 3: Configure OAuth Consent Screen

### 3.1 Go to OAuth Consent Screen

Visit: https://console.cloud.google.com/apis/credentials/consent

### 3.2 Choose User Type

- Select **"External"** (for public app)
- Click **"CREATE"**

### 3.3 Fill App Information

**Page 1: App Information**

| Field | Value |
|-------|-------|
| App name | `Chhattisgarh Shadi` |
| User support email | `your-email@example.com` |
| App logo | (Upload your app logo - 120x120px PNG/JPG) |
| Application home page | `https://chhattisgarhshadi-backend.onrender.com` |
| Application privacy policy | (Your privacy policy URL) |
| Application terms of service | (Your terms of service URL) |
| Authorized domains | `onrender.com` |
| Developer contact email | `your-email@example.com` |

Click **"SAVE AND CONTINUE"**

**Page 2: Scopes**

1. Click **"ADD OR REMOVE SCOPES"**
2. Select these scopes:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

**Page 3: Test Users**

- Add test user emails (optional during development)
- Click **"SAVE AND CONTINUE"**

**Page 4: Summary**

- Review everything
- Click **"BACK TO DASHBOARD"**

---

## 🔐 Step 4: Create OAuth 2.0 Credentials

This is the **MOST IMPORTANT STEP** for InAppBrowser implementation.

### 4.1 Go to Credentials Page

Visit: https://console.cloud.google.com/apis/credentials

### 4.2 Create OAuth Client ID

1. Click **"CREATE CREDENTIALS"**
2. Select **"OAuth 2.0 Client ID"**

### 4.3 Configure OAuth Client

**Application type:** Select **"Web application"**

**Name:** `Chhattisgarh Shadi Backend`

**Authorized JavaScript origins:**
- Add: `https://chhattisgarhshadi-backend.onrender.com`
- Add: `http://localhost:8080` (for development)

**Authorized redirect URIs:**

Add these **EXACTLY** as shown:

**For Production:**
```
https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
```

**For Development:**
```
http://localhost:8080/api/v1/auth/google/callback
http://10.0.2.2:8080/api/v1/auth/google/callback
```

### 4.4 Save and Get Credentials

1. Click **"CREATE"**
2. A popup will show your credentials:
   - **Client ID:** `123456789-abc123.apps.googleusercontent.com`
   - **Client Secret:** `GOCSPX-abcd1234efgh5678`
3. **IMPORTANT:** Copy both values immediately!

---

## 🔧 Step 5: Configure Backend Environment Variables

### 5.1 Update Render Environment Variables

1. Go to: https://dashboard.render.com/
2. Select your **chhattisgarhshadi-backend** service
3. Go to **"Environment"** tab
4. Add these variables:

```env
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcd1234efgh5678
```

5. Click **"Save Changes"**
6. Render will automatically redeploy

### 5.2 Update Local Development .env

Update your local `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID="123456789-abc123.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcd1234efgh5678"
```

---

## 📱 Step 6: Configure React Native App

### 6.1 Install Required Package

```bash
npm install react-native-inappbrowser-reborn
```

### 6.2 Create Auth Configuration

Create file: `config/auth.js`

```javascript
import { Platform } from 'react-native';

// Backend URL based on environment
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
  // IMPORTANT: Use the SAME Client ID as backend
  clientId: '123456789-abc123.apps.googleusercontent.com',
  redirectUrl: `${getBackendUrl()}/api/v1/auth/google/callback`,
  scopes: ['openid', 'profile', 'email'],
};
```

**⚠️ CRITICAL:** 
- Use the **SAME Client ID** as your backend
- The `redirectUrl` MUST match exactly what you configured in Google Cloud Console
- Use `http://10.0.2.2:8080` for Android emulator (NOT `localhost`)

### 6.3 Implement Google Sign-In

Create file: `services/authService.js`

```javascript
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

    console.log('🔐 Opening Google OAuth...');

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
          console.log('✅ Got authorization code');
          
          // 5. Exchange code for tokens at backend
          const response = await axios.post(`${API_BASE_URL}/auth/google`, {
            authorizationCode: code,
            redirectUri: GOOGLE_OAUTH_CONFIG.redirectUrl,
          });

          console.log('Backend response:', response.data);

          // 6. Save tokens
          const { accessToken, refreshToken, user } = response.data.data;
          
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
    console.error('❌ Google Sign-In Error:', error);
    
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

### 6.4 Use in Login Screen

Create file: `screens/LoginScreen.js`

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signInWithGoogle } from '../services/authService';

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        Alert.alert('Success', 'Login successful!');
        // Navigate to home screen
        navigation.replace('Home');
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chhattisgarh Shadi</Text>
      <Text style={styles.subtitle}>Find your perfect match</Text>
      
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
```

---

## 🧪 Step 7: Testing

### 7.1 Test in Development

**Start Backend:**
```bash
cd chhattisgarhshadi-backend
npm run dev
# Should run on http://localhost:8080
```

**Run React Native App:**

For Android:
```bash
npx react-native run-android
```

For iOS:
```bash
npx react-native run-ios
```

**Test Flow:**
1. Open the app
2. Click "Sign in with Google"
3. InAppBrowser should open with Google login page
4. Sign in with your Google account
5. Browser should close and return to app
6. You should be logged in!

### 7.2 Debug Issues

**If authentication fails, check:**

1. **Check backend logs:**
   ```bash
   npm run dev
   # Watch console for errors
   ```

2. **Check mobile app logs:**
   ```bash
   # Android
   npx react-native log-android
   
   # iOS
   npx react-native log-ios
   ```

3. **Common issues:**
   - ❌ `redirect_uri_mismatch` → Redirect URIs don't match in Google Console
   - ❌ `invalid_client` → Client ID or Secret is wrong
   - ❌ `Connection refused` → Backend not running or wrong URL
   - ❌ `InAppBrowser not available` → Package not properly installed

---

## 📝 Step 8: Production Deployment

### 8.1 Update Google Cloud Redirect URIs

Make sure these are added:

```
https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
```

### 8.2 Update React Native App Config

Update `config/auth.js` to use production URL:

```javascript
const getBackendUrl = () => {
  if (__DEV__) {
    return Platform.select({
      android: 'http://10.0.2.2:8080',
      ios: 'http://localhost:8080',
    });
  } else {
    // Production URL
    return 'https://chhattisgarhshadi-backend.onrender.com';
  }
};
```

### 8.3 Build Production App

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
# Then open Xcode and archive
```

---

## ✅ Verification Checklist

Before going to production, verify:

- [ ] Google Cloud project created
- [ ] OAuth Consent Screen configured
- [ ] OAuth 2.0 Client ID created (Web application type)
- [ ] Redirect URIs added (both dev and prod)
- [ ] Client ID and Secret added to backend `.env` and Render
- [ ] Backend deployed and accessible at `https://chhattisgarhshadi-backend.onrender.com`
- [ ] React Native app has correct Client ID in `config/auth.js`
- [ ] Tested login flow in development
- [ ] Tested login flow in production

---

## 🔒 Security Best Practices

### ✅ DO:
- Store `GOOGLE_CLIENT_SECRET` only on backend (never in React Native app)
- Use environment variables for sensitive data
- Validate tokens on backend before trusting user data
- Use HTTPS in production
- Keep Client ID and Secret secure

### ❌ DON'T:
- Don't hardcode Client ID/Secret in code
- Don't commit `.env` files to git
- Don't use HTTP in production
- Don't skip token verification on backend
- Don't trust client-side data without verification

---

## 🐛 Troubleshooting

### Issue: "redirect_uri_mismatch"

**Cause:** The redirect URI in your app doesn't match Google Cloud Console.

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add exact redirect URI: `https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback`
4. Make sure `redirectUrl` in `config/auth.js` matches exactly

### Issue: "invalid_client"

**Cause:** Wrong Client ID or Secret.

**Solution:**
1. Verify Client ID in `config/auth.js` matches Google Console
2. Verify Client Secret in backend `.env` matches Google Console
3. Make sure no extra spaces or quotes

### Issue: "access_denied"

**Cause:** User cancelled login or OAuth Consent Screen not published.

**Solution:**
1. Go to OAuth Consent Screen
2. Click "PUBLISH APP" (if still in testing)
3. Try login again

### Issue: "Cannot connect to backend"

**Android Emulator:**
```javascript
// Use this URL
android: 'http://10.0.2.2:8080'
// NOT localhost or 127.0.0.1
```

**Real Device:**
```javascript
// Find your computer's IP
ifconfig  // Mac/Linux
ipconfig  // Windows

// Use your IP
android: 'http://192.168.1.100:8080'
```

### Issue: "InAppBrowser not available"

**Solution:**
```bash
# Reinstall package
npm install react-native-inappbrowser-reborn

# iOS
cd ios && pod install

# Clean and rebuild
# Android
cd android && ./gradlew clean

# iOS
cd ios && rm -rf Pods Podfile.lock && pod install
```

---

## 📞 Support

If you encounter issues:

1. Check [API Documentation](./API_DOCUMENTATION.md)
2. Review [React Native Setup](./REACT_NATIVE_SETUP.md)
3. Check backend logs: `npm run dev`
4. Check mobile logs: `npx react-native log-android` or `log-ios`
5. Verify environment variables are correct

---

## 📚 Additional Resources

- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [InAppBrowser Docs](https://github.com/proyecto26/react-native-inappbrowser)
- [API Documentation](./API_DOCUMENTATION.md)
- [React Native Setup](./REACT_NATIVE_SETUP.md)

---

**Last Updated:** November 14, 2025
