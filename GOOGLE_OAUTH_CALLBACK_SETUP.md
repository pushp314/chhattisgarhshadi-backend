# Google OAuth Callback Route Setup

## ✅ What Was Added

The backend now supports **redirect-based OAuth flow** via the new callback route:

**Endpoint**: `GET /api/v1/auth/google/callback`

This route handles Google's redirect after user authentication and exchanges the authorization code for tokens.

---

## 🔧 Configuration Required

### 1. Environment Variables

Add to your `.env` file:
```env
GOOGLE_CALLBACK_URL=https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback
```

For local development:
```env
GOOGLE_CALLBACK_URL=http://localhost:8080/api/v1/auth/google/callback
```

### 2. Google Cloud Console Setup

**Go to**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

1. Select your project
2. Click on your **Web Application** OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   - Production: `https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback`
   - Local: `http://localhost:8080/api/v1/auth/google/callback` (for testing)
4. Save changes

---

## 🔄 How It Works

### Flow Diagram
```
User clicks "Login with Google" 
    ↓
Frontend opens InAppBrowser/WebView
    ↓
Redirects to Google OAuth URL with redirect_uri
    ↓
User chooses account and approves
    ↓
Google redirects to: /api/v1/auth/google/callback?code=AUTH_CODE
    ↓
Backend exchanges code for tokens
    ↓
Backend creates/finds user in database
    ↓
Backend redirects to app via deep link:
    com.chhattisgarhshaadi.app://oauth-success?accessToken=xxx&refreshToken=xxx&isNewUser=true
    ↓
App extracts tokens and saves them
```

### Backend Callback Handler

The callback route automatically:
1. Receives authorization code from Google
2. Exchanges code for user information
3. Creates or finds user in database
4. Generates JWT tokens
5. Redirects back to app with tokens via deep link

---

## 📱 Frontend Integration

### Example: Using InAppBrowser in React Native

```javascript
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { Linking } from 'react-native';

const handleGoogleLogin = async () => {
  try {
    const clientId = 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = 'https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback';
    
    const authUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=email%20profile&` +
      `access_type=offline&` +
      `prompt=select_account`;

    // Setup deep link listener BEFORE opening browser
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('com.chhattisgarhshaadi.app://oauth-success')) {
        // Extract tokens from URL
        const params = new URLSearchParams(url.split('?')[1]);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const isNewUser = params.get('isNewUser') === 'true';
        
        // Save tokens
        await saveTokens(accessToken, refreshToken);
        
        // Navigate based on isNewUser
        if (isNewUser) {
          navigation.navigate('CompleteProfile');
        } else {
          navigation.navigate('Home');
        }
        
        // Close browser
        InAppBrowser.close();
      } else if (url.startsWith('com.chhattisgarhshaadi.app://oauth-error')) {
        // Handle error
        const params = new URLSearchParams(url.split('?')[1]);
        const error = params.get('error');
        Alert.alert('Login Failed', error);
        InAppBrowser.close();
      }
    });

    // Open InAppBrowser
    const result = await InAppBrowser.openAuth(authUrl, 'com.chhattisgarhshaadi.app://oauth-success');
    
    // Clean up listener
    subscription.remove();
    
  } catch (error) {
    console.error('Google login error:', error);
    Alert.alert('Error', 'Failed to open Google login');
  }
};
```

### Deep Link Setup (AndroidManifest.xml)

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="com.chhattisgarhshaadi.app" />
</intent-filter>
```

### Deep Link Setup (iOS - Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.chhattisgarhshaadi.app</string>
    </array>
  </dict>
</array>
```

---

## 🧪 Testing

### Test Locally

1. Start your backend: `npm run dev`
2. Open in browser:
   ```
   http://localhost:8080/api/v1/auth/google/callback?code=test
   ```
3. Should redirect to: `com.chhattisgarhshaadi.app://oauth-error?error=...`
   (Error is expected without valid Google code)

### Test with Real Google OAuth

1. Build the frontend OAuth URL:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=http://localhost:8080/api/v1/auth/google/callback&
     response_type=code&
     scope=email%20profile
   ```
2. Open this URL in your browser
3. Login with Google
4. Watch the callback in your terminal logs

---

## 🔍 Error Handling

The callback route handles these scenarios:

1. **Missing Code**: Redirects to `oauth-error?error=Authorization+code+missing`
2. **Google Error**: Redirects to `oauth-error?error=access_denied` (or other Google error)
3. **Invalid Code**: Redirects to `oauth-error?error=Invalid authorization code`
4. **Success**: Redirects to `oauth-success?accessToken=xxx&refreshToken=xxx&isNewUser=true/false`

---

## 📋 Alternative: Keep Using POST Endpoint

If you prefer, you can still use the existing **POST /api/v1/auth/google** endpoint where the frontend handles OAuth entirely and just sends the code:

```javascript
// Frontend gets authorization code
const code = await getGoogleAuthCode();

// Send to backend
const response = await fetch('https://your-backend.com/api/v1/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    authorizationCode: code,
    redirectUri: 'com.chhattisgarhshaadi.app://oauth2redirect'
  })
});

const data = await response.json();
// data contains: { accessToken, refreshToken, user, isNewUser }
```

---

## ✅ Checklist

- [x] Backend callback route added: `GET /api/v1/auth/google/callback`
- [ ] Add `GOOGLE_CALLBACK_URL` to `.env`
- [ ] Add redirect URI to Google Cloud Console
- [ ] Setup deep links in React Native app
- [ ] Implement InAppBrowser OAuth flow in frontend
- [ ] Test with real Google account

---

## 🆘 Troubleshooting

### Error: "redirect_uri_mismatch"
**Cause**: Redirect URI not added in Google Console  
**Fix**: Add exact callback URL to Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs

### Error: "Route not found"
**Cause**: Backend not updated or server not restarted  
**Fix**: Restart backend server with `npm run dev`

### Deep link not working
**Cause**: App not configured to handle deep links  
**Fix**: Check AndroidManifest.xml and Info.plist for proper scheme configuration

### Tokens not received in app
**Cause**: Deep link listener not setup before opening browser  
**Fix**: Add `Linking.addEventListener` BEFORE calling `InAppBrowser.openAuth`

---

## 📚 Related Documentation

- [Google OAuth 2.0 Flow](https://developers.google.com/identity/protocols/oauth2)
- [React Native InAppBrowser](https://github.com/proyecto26/react-native-inappbrowser)
- [Deep Linking in React Native](https://reactnative.dev/docs/linking)
