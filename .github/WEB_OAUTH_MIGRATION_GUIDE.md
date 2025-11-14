# Web-Based OAuth Migration Guide ✅

## Overview
Backend now supports **Web-Based OAuth flow** with authorization code exchange while maintaining **backward compatibility** with the legacy idToken flow.

**Status:** ✅ FULLY IMPLEMENTED

---

## 🎯 What Changed

### Before (Legacy Flow)
```javascript
// Frontend sends
{
  idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  deviceInfo: { ... }
}

// Backend verifies idToken directly
```

### After (New Web-Based OAuth Flow)
```javascript
// Frontend sends
{
  authorizationCode: "4/0AeanS0ZE8...",
  redirectUri: "http://localhost:8080/auth/google/callback",
  deviceInfo: { ... }
}

// Backend exchanges code for tokens, then verifies
```

### Backward Compatibility ✅
The backend **still accepts idToken** for existing mobile apps that haven't updated yet!

---

## 📝 Backend Changes Summary

### 1. Updated Files

| File | Changes | Status |
|------|---------|--------|
| `src/config/googleAuth.js` | Added `verifyAuthorizationCode()` method | ✅ |
| `src/services/auth.service.js` | Added `verifyGoogleAuthCode()` method | ✅ |
| `src/controllers/auth.controller.js` | Support both flows with auto-detection | ✅ |
| `src/validation/auth.validation.js` | Accept `authorizationCode` OR `idToken` | ✅ |
| `.env.example` | Added `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` | ✅ |

### 2. New Environment Variables

Add these to your `.env` file:

```env
# Google OAuth - Web-Based Flow
GOOGLE_CLIENT_ID=250704044564-q3ql66oruro0a17ipumla9cloda24tkk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
# For development:
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
# For production:
# GOOGLE_REDIRECT_URI=https://your-production-domain.com/auth/google/callback
```

**How to get Client Secret:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your **Web application** OAuth 2.0 Client ID
3. Copy the **Client secret**
4. Paste it in `.env`

---

## 🚀 API Endpoint Behavior

### Endpoint: `POST /api/auth/google`

#### Option 1: Web-Based OAuth (NEW)
```bash
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "authorizationCode": "4/0AeanS0ZE8...",
    "redirectUri": "http://localhost:8080/auth/google/callback",
    "deviceInfo": {
      "deviceId": "device123",
      "deviceName": "Pixel 6",
      "deviceType": "Android"
    }
  }'
```

**Flow:**
1. Backend receives `authorizationCode`
2. Exchanges code with Google → gets tokens
3. Verifies ID token → gets user info
4. Creates/updates user in database
5. Returns JWT tokens + user data

#### Option 2: Legacy idToken (BACKWARD COMPATIBLE)
```bash
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    "deviceInfo": {
      "deviceId": "device123",
      "deviceName": "Pixel 6",
      "deviceType": "Android"
    }
  }'
```

**Flow:**
1. Backend receives `idToken`
2. Verifies ID token directly with Google
3. Creates/updates user in database
4. Returns JWT tokens + user data

#### Response (Both Flows)
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "https://...",
      "role": "USER",
      "isPhoneVerified": false,
      "isActive": true,
      "preferredLanguage": "EN",
      "profile": null,
      "createdAt": "2025-11-14T...",
      "updatedAt": "2025-11-14T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "expiresIn": "15m",
    "isNewUser": true
  },
  "message": "Account created successfully",
  "success": true
}
```

---

## 🔧 Google Cloud Console Setup

### Step 1: Add Redirect URIs
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your **Web application** OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:8080/auth/google/callback
   https://your-production-domain.com/auth/google/callback
   ```
4. (Optional) Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:8080
   https://your-production-domain.com
   ```
5. Click **Save**

### Step 2: Verify Client Type
- ✅ Make sure you're using **Web application** client
- ❌ **NOT** Android or iOS client types
- The Web client supports authorization code flow

### Step 3: Get Client Secret
1. On the same page, copy **Client secret**
2. Add to `.env` as `GOOGLE_CLIENT_SECRET`

### Step 4: OAuth Consent Screen (if needed)
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Ensure consent screen is configured
3. Add test users if not published
4. Scopes needed: `email`, `profile`, `openid`

---

## 🧪 Testing

### Test Web-Based OAuth Flow

1. **Start Backend:**
   ```bash
   npm run dev
   ```

2. **Test Authorization Code Exchange:**
   ```bash
   # Replace with actual authorization code from Google OAuth
   curl -X POST http://localhost:8080/api/auth/google \
     -H "Content-Type: application/json" \
     -d '{
       "authorizationCode": "YOUR_AUTH_CODE_HERE",
       "redirectUri": "http://localhost:8080/auth/google/callback"
     }'
   ```

3. **Expected Response:**
   - Status: 200
   - Contains: `accessToken`, `refreshToken`, `user` object
   - `isNewUser`: true (first time) or false (existing user)

### Test Legacy idToken Flow (Backward Compatibility)

```bash
# This should still work!
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_ID_TOKEN_HERE"
  }'
```

### Test Validation Errors

**Missing both parameters:**
```bash
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request
# Message: "Either authorizationCode or idToken is required"
```

---

## 🔍 Code Architecture

### 1. GoogleAuthClient (`src/config/googleAuth.js`)
```javascript
class GoogleAuthClient {
  // NEW: Exchange authorization code for user info
  async verifyAuthorizationCode(authorizationCode, redirectUri)
  
  // EXISTING: Verify ID token directly (backward compatibility)
  async verifyIdToken(idToken)
}
```

### 2. AuthService (`src/services/auth.service.js`)
```javascript
class AuthService {
  // NEW: Handle authorization code flow
  async verifyGoogleAuthCode(authorizationCode, redirectUri, ipAddress, deviceInfo)
  
  // EXISTING: Handle idToken flow
  async verifyGoogleToken(idToken, ipAddress, deviceInfo)
  
  // PRIVATE: Common logic for both flows
  async _processGoogleAuth(googleUser, ipAddress, deviceInfo)
}
```

### 3. AuthController (`src/controllers/auth.controller.js`)
```javascript
googleMobileAuth = asyncHandler(async (req, res) => {
  const { authorizationCode, idToken, redirectUri, deviceInfo } = req.body;
  
  // Auto-detect which flow to use
  if (authorizationCode) {
    // Use Web-Based OAuth flow
  } else if (idToken) {
    // Use legacy flow
  } else {
    // Error: need one of them
  }
});
```

---

## 🔒 Security Considerations

### ✅ What's Better with Web-Based OAuth
1. **More Secure**: Authorization code can only be used once
2. **Server-Side Exchange**: Client secret never exposed to mobile app
3. **Better Token Management**: Backend controls token lifecycle
4. **Standards Compliant**: Follows OAuth 2.0 spec correctly

### ✅ Security Measures in Place
- ✅ Client secret stored server-side only
- ✅ Authorization code validated before exchange
- ✅ ID token verified after exchange
- ✅ Email verification checked
- ✅ Token issuer validated
- ✅ One-time use codes (Google enforces this)
- ✅ IP tracking and device info logging
- ✅ Refresh token stored in database
- ✅ Account ban/inactive checks

---

## 📊 Migration Checklist

### Backend Setup (You)
- [x] Update `googleAuth.js` with authorization code support
- [x] Update `auth.service.js` with new flow method
- [x] Update `auth.controller.js` to detect flow type
- [x] Update `auth.validation.js` to accept both parameters
- [x] Update `.env.example` with new variables
- [ ] **Add `GOOGLE_CLIENT_SECRET` to production `.env`**
- [ ] **Add redirect URI in Google Console**
- [ ] Test authorization code flow
- [ ] Deploy to production

### Frontend (Already Done)
- [x] Implement Web-Based OAuth with authorization code
- [x] Send `authorizationCode` and `redirectUri` to backend
- [x] Handle OAuth redirect in app
- [x] Test end-to-end flow

---

## 🐛 Troubleshooting

### Error: "GOOGLE_CLIENT_SECRET is required"
**Solution:** Add `GOOGLE_CLIENT_SECRET` to your `.env` file

### Error: "redirect_uri_mismatch"
**Solution:** 
1. Check redirect URI in Google Console matches exactly: `http://localhost:8080/auth/google/callback`
2. Ensure you're using **Web application** client type
3. Verify redirect URI is in **Authorized redirect URIs** list

### Error: "Invalid authorization code"
**Possible Causes:**
1. Code already used (codes are single-use)
2. Code expired (valid for ~10 minutes)
3. Redirect URI mismatch
4. Wrong client credentials

### Error: "No ID token received from Google"
**Solution:** Ensure scopes include `openid`, `email`, `profile` in frontend OAuth request

### Legacy Flow Still Works?
**Yes!** The backend automatically detects which flow to use based on parameters sent.

---

## 🚀 Benefits Summary

### For Users
✅ No more "DEVELOPER_ERROR" issues
✅ Works on emulators without Play Services
✅ Consistent Google sign-in experience
✅ Better reliability

### For Developers
✅ Follows OAuth 2.0 best practices
✅ More secure (server-side token exchange)
✅ No SHA-1 certificate management
✅ Easier testing and debugging
✅ Backward compatible (no breaking changes)

### For Production
✅ More reliable authentication
✅ Better security posture
✅ Standards compliant
✅ Future-proof architecture

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 for Mobile Apps](https://oauth.net/2/native-apps/)
- [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs)

---

## ✅ Implementation Status

**Backend Changes:** ✅ COMPLETE  
**Environment Setup:** ⚠️ PENDING (add GOOGLE_CLIENT_SECRET to .env)  
**Google Console:** ⚠️ PENDING (add redirect URI)  
**Testing:** ⏳ READY TO TEST  
**Deployment:** ⏳ PENDING

---

**Last Updated:** 2025-11-14  
**Backend Version:** v1.0  
**Implemented By:** AI Assistant (Claude Sonnet 4.5)
