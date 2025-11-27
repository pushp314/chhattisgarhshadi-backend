# Authentication API Documentation

**Base URL:** `https://chhattisgarhshadi-backend.onrender.com/api/v1`

**Last Updated:** November 20, 2025

---

## Overview

This backend uses **Google OAuth 2.0 as the PRIMARY and ONLY authentication method**. There is no email/password registration. All authentication endpoints support both:
1. **Authorization Code Flow** (Recommended for web and React Native with InAppBrowser)
2. **ID Token Flow** (Legacy, for backward compatibility)

**Key Features:**
- ✅ Google-only authentication (no password required)
- ✅ JWT access tokens (15 minutes) + refresh tokens (7 days)
- ✅ Multi-device session management
- ✅ Agent referral tracking via `agentCode`
- ✅ Phone verification (one-time, post-login)
- ✅ Rate limiting on all endpoints
- ✅ Automatic account creation on first login

---

## Table of Contents

1. [Google Authentication](#1-google-authentication)
2. [Google Callback (Server-Side)](#2-google-callback-server-side)
3. [Refresh Access Token](#3-refresh-access-token)
4. [Logout](#4-logout)
5. [Send Phone OTP](#5-send-phone-otp)
6. [Verify Phone OTP](#6-verify-phone-otp)
7. [Error Responses](#error-responses)
8. [Rate Limiting](#rate-limiting)

---

## 1. Google Authentication

### `POST /auth/google`

**Purpose:** Primary endpoint for user login and registration. Supports both authorization code (recommended) and ID token (legacy) flows.

**Authentication:** None required  
**Rate Limit:** Yes (Strict - 200 requests per 2 minutes)

### Request Body

You must provide **EITHER** `authorizationCode` (recommended) **OR** `idToken` (legacy).

#### Option A: Authorization Code Flow (Recommended)

```json
{
  "authorizationCode": "4/0AY0e-g7XXXXXXXXXXX",
  "redirectUri": "com.chhattisgarhshaadi.app://oauth2redirect",
  "agentCode": "AGT000001",
  "deviceInfo": {
    "deviceId": "unique-device-id",
    "deviceName": "iPhone 14 Pro",
    "deviceType": "IOS",
    "userAgent": "Mozilla/5.0..."
  }
}
```

#### Option B: ID Token Flow (Legacy)

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjM4...",
  "agentCode": "AGT000001",
  "deviceInfo": {
    "deviceId": "unique-device-id",
    "deviceName": "Samsung Galaxy S22",
    "deviceType": "ANDROID",
    "userAgent": "Mozilla/5.0..."
  }
}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `authorizationCode` | string | Conditional* | Authorization code from Google OAuth flow |
| `redirectUri` | string (URL) | Conditional** | Redirect URI used in OAuth flow (e.g., `com.chhattisgarhshaadi.app://oauth2redirect`) |
| `idToken` | string | Conditional* | Google ID token (legacy flow) |
| `agentCode` | string (max 20) | No | Agent referral code for tracking signups |
| `deviceInfo` | object | No | Device information for session tracking |
| `deviceInfo.deviceId` | string | No | Unique device identifier |
| `deviceInfo.deviceName` | string | No | Human-readable device name |
| `deviceInfo.deviceType` | string | No | Device type: `IOS`, `ANDROID`, or `WEB` |
| `deviceInfo.userAgent` | string | No | User agent string |

**\* Conditional:** Must provide **EITHER** `authorizationCode` **OR** `idToken` (not both).  
**\*\* Conditional:** `redirectUri` is **required** if using `authorizationCode`.

### Validation Rules

- If `authorizationCode` is provided, `redirectUri` MUST be a valid URL
- If neither `authorizationCode` nor `idToken` is provided, request fails with 400
- `agentCode` must be max 20 characters
- Google email must be verified

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": null,
      "lastName": null,
      "profilePicture": "https://lh3.googleusercontent.com/...",
      "role": "USER",
      "isPhoneVerified": false,
      "isActive": true,
      "preferredLanguage": "HI",
      "profile": null,
      "createdAt": "2025-11-20T07:45:00.000Z",
      "updatedAt": "2025-11-20T07:45:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m",
    "isNewUser": true
  },
  "message": "Account created successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | object | User object with basic profile info |
| `user.id` | number | Unique user ID |
| `user.email` | string | User's Google email |
| `user.profilePicture` | string | Google profile picture URL |
| `user.role` | enum | User role: `USER`, `PREMIUM_USER`, `VERIFIED_USER`, `ADMIN` |
| `user.isPhoneVerified` | boolean | Whether phone is verified |
| `user.preferredLanguage` | enum | Language preference: `EN`, `HI`, `CG` (default: `HI`) |
| `user.profile` | object\|null | Full profile object (null if not created yet) |
| `accessToken` | string (JWT) | Short-lived access token (15 minutes) |
| `refreshToken` | string (JWT) | Long-lived refresh token (7 days) |
| `expiresIn` | string | Access token expiration time |
| `isNewUser` | boolean | `true` if account was just created, `false` if existing user logged in |

### Message Variants

- **New User:** `"Account created successfully"`
- **Existing User:** `"Login successful"`

### Error Responses

| Status Code | Condition | Message |
|-------------|-----------|---------|
| 400 | Neither authorizationCode nor idToken provided | `"Either authorizationCode or idToken is required"` |
| 400 | `redirectUri` missing when using authorizationCode | Validation error |
| 401 | Invalid authorization code | `"Invalid authorization code: [error details]"` |
| 401 | Invalid ID token | `"Invalid Google ID token"` |
| 401 | Google email not verified | `"Google account email is not verified"` |
| 409 | Email already exists (different googleId) | `"An account with this email already exists."` |
| 403 | Account is banned | `"Account suspended: [reason]"` |
| 403 | Account is inactive | `"Account is inactive"` |

### Notes

1. **First-Time Users:**
   - If `isNewUser: true`, the frontend MUST navigate to profile creation flow
   - Profile creation is required before accessing main app features

2. **Agent Referral:**
   - If `agentCode` is provided and valid, the user is linked to that agent
   - Invalid agent codes are ignored (no error thrown)
   - Only applies to NEW users, not existing users

3. **Device Tracking:**
   - `deviceInfo` is stored for session management
   - Used for "Active Devices" feature in settings

4. **Token Storage:**
   - Store `accessToken` and `refreshToken` securely (e.g., React Native Keychain)
   - Use `accessToken` in `Authorization: Bearer <token>` header for all authenticated requests

---

## 2. Google Callback (Server-Side)

### `GET /auth/google/callback`

**Purpose:** Server-side redirect URI for web-based Google OAuth 2.0 flow. **Not intended for direct client calls.**

**Authentication:** None required  
**Rate Limit:** Yes

### Flow

1. Frontend initiates OAuth by redirecting user to Google
2. User approves consent
3. Google redirects to this endpoint with `code` query parameter
4. Backend exchanges `code` for tokens
5. Backend redirects to app deep link with tokens

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Authorization code from Google |
| `error` | string | No | Error code if user denied consent |

### Success Redirect

```
com.chhattisgarhshaadi.app://oauth-success?accessToken=<token>&refreshToken=<token>&isNewUser=<bool>
```

### Error Redirect

```
com.chhattisgarhshaadi.app://oauth-error?error=<error_message>
```

### Error Cases

| Condition | Redirect |
|-----------|----------|
| User denied consent | `error=User cancelled the authentication` |
| Authorization code missing | `error=Authorization code missing` |
| Backend verification failed | `error=<error message from backend>` |

### Notes

- This endpoint is automatically called by Google after user consent
- Not typically used for mobile apps (prefer direct authorization code exchange via `POST /auth/google`)
- Deep links must be configured in your React Native app

---

## 3. Refresh Access Token

### `POST /auth/refresh`

**Purpose:** Generate a new access token using a valid refresh token.

**Authentication:** None required (refresh token validated)  
**Rate Limit:** Yes (200 requests per 2 minutes)

### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | Valid refresh token received from login/refresh |

### Validation Rules

- `refreshToken` cannot be empty
- Must be a valid JWT
- Must not be expired
- Must not be revoked

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  },
  "message": "Token refreshed successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `accessToken` | string (JWT) | New short-lived access token (15 minutes) |
| `refreshToken` | string (JWT) | New long-lived refresh token (7 days) |
| `expiresIn` | string | Access token expiration time |

### Error Responses

| Status Code | Condition | Message |
|-------------|-----------|---------|
| 400 | `refreshToken` missing or empty | Validation error |
| 401 | Invalid refresh token signature | `"Token refresh failed"` or `"Invalid or expired refresh token"` |
| 401 | Token expired | `"Invalid or expired refresh token"` |
| 401 | Token revoked | `"Invalid or expired refresh token"` |
| 403 | User account inactive or banned | `"Account is not active"` |

### Notes

1. **Token Rotation:**
   - The old refresh token is **revoked** immediately
   - A new refresh token is issued
   - Old token cannot be reused (prevents token replay attacks)

2. **When to Refresh:**
   - Access token expires in 15 minutes
   - Recommended: Refresh when you get 401 response
   - Alternative: Refresh proactively before expiration

3. **Error Handling:**
   - If refresh fails with 401, user MUST re-authenticate via Google
   - Clear stored tokens and redirect to login screen

---

## 4. Logout

### `POST /auth/logout`

**Purpose:** Log out the user by revoking refresh tokens.

**Authentication:** **Required** (Bearer token)  
**Rate Limit:** Yes (200 requests per 2 minutes)

### Request Headers

```
Authorization: Bearer <accessToken>
```

### Request Body

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**OR (to logout from all devices):**

```json
{}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | No | Specific refresh token to revoke. If omitted, ALL tokens are revoked. |

### Behavior

- **With `refreshToken`:** Logs out from **current device only** (revokes that specific token)
- **Without `refreshToken`:** Logs out from **ALL devices** (revokes all refresh tokens for the user)

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Logged out successfully"
}
```

### Error Responses

| Status Code | Condition | Message |
|-------------|-----------|---------|
| 401 | No access token provided | `"Access token required"` |
| 401 | Invalid access token | `"Invalid or expired token"` |
| 500 | Database error | `"Logout failed"` |

### Notes

1. **After Logout:**
   - Clear both `accessToken` and `refreshToken` from client storage
   - Navigate user to login screen
   - Any API calls with old tokens will return 401

2. **Logout All Devices:**
   - Use this when user suspects unauthorized access
   - Forces re-authentication on all devices

---

## 5. Send Phone OTP

### `POST /auth/phone/send-otp`

**Purpose:** Send a 6-digit OTP to the user's phone for one-time verification. **This is NOT for login.**

**Authentication:** **Required** (Bearer token)  
**Rate Limit:** **Strict** (3 requests per 15 minutes - OTP limit)

### Request Headers

```
Authorization: Bearer <accessToken>
```

### Request Body

```json
{
  "phone": "9876543210",
  "countryCode": "+91"
}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | 10-digit Indian phone number (must start with 6, 7, 8, or 9) |
| `countryCode` | string | No | Country code (default: `"+91"`) |

### Validation Rules

- `phone` must match regex: `/^[6-9]\d{9}$/` (10 digits, starts with 6-9)
- `countryCode` must start with `+`
- Phone cannot already be verified for this user
- Phone cannot be registered by another verified user

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "expiresIn": 300,
    "otpSentTo": "+919876543210"
  },
  "message": "OTP sent successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `expiresIn` | number | OTP validity in seconds (300 = 5 minutes) |
| `otpSentTo` | string | Full phone number with country code |

### Error Responses

| Status Code | Condition | Message |
|-------------|-----------|---------|
| 400 | Invalid phone format | `"Invalid phone number format"` |
| 400 | Phone already verified for this user | `"Phone already verified"` |
| 401 | No access token | `"Access token required"` |
| 409 | Phone registered by another user | `"Phone number already registered"` |
| 429 | Too many OTP requests | Rate limit error |
| 500 | SMS sending failed | `"Failed to send OTP"` |

### Notes

1. **OTP Details:**
   - 6-digit numeric code
   - Valid for 5 minutes
   - Hashed with bcrypt before storage
   - Max 3 verification attempts per OTP

2. **SMS Service:**
   - Uses MSG91 API (configured in `.env`)
   - If MSG91 is not configured, this endpoint will fail
   - OTP is sent to: `<countryCode><phone>`

3. **Rate Limiting:**
   - **STRICT:** Only 3 OTP requests per 15 minutes
   - Prevents SMS abuse
   - If limit exceeded, wait 15 minutes

4. **Re-sending OTP:**
   - Calling this endpoint again generates a NEW OTP
   - Previous OTP is invalidated

---

## 6. Verify Phone OTP

### `POST /auth/phone/verify-otp`

**Purpose:** Verify the OTP sent to the user's phone. Updates user's phone and marks it as verified.

**Authentication:** **Required** (Bearer token)  
**Rate Limit:** Yes (200 requests per 2 minutes)

### Request Headers

```
Authorization: Bearer <accessToken>
```

### Request Body

```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

### Request Body Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | Yes | 10-digit phone number (same as used in send-otp) |
| `otp` | string | Yes | 6-digit OTP received via SMS |

### Validation Rules

- `phone` must match regex: `/^[6-9]\d{9}$/`
- `otp` must be exactly 6 digits
- OTP must not be expired (< 5 minutes old)
- Max 3 attempts per OTP

### Success Response (200 OK)

```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Phone verified successfully"
}
```

### Effects on User Record

After successful verification:
- `user.phone` = verified phone number
- `user.countryCode` = country code used
- `user.isPhoneVerified` = `true`
- `user.phoneVerifiedAt` = current timestamp

### Error Responses

| Status Code | Condition | Message |
|-------------|-----------|---------|
| 400 | Invalid phone format | `"Invalid phone number format"` |
| 400 | Invalid OTP length | `"OTP must be 6 digits"` |
| 400 | OTP expired or not found | `"OTP expired or not found"` |
| 400 | Incorrect OTP | `"Invalid OTP. X attempts remaining."` |
| 401 | No access token | `"Access token required"` |
| 429 | Max attempts exceeded (3) | `"Maximum OTP attempts exceeded"` |

### Notes

1. **Attempt Tracking:**
   - Each incorrect OTP increments the attempt counter
   - After 3 failed attempts, must request new OTP

2. **OTP Expiration:**
   - OTP expires 5 minutes after generation
   - Expired OTPs cannot be verified
   - Must request new OTP

3. **Phone Uniqueness:**
   - Once verified, phone number is permanently linked to this user
   - No other user can verify the same number

4. **Security:**
   - OTP is bcrypt-hashed in database
   - Cannot retrieve original OTP (one-way hash)

---

## Error Responses

### Standard Error Format

All error responses follow this structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message describing what went wrong",
  "errors": [
    {
      "field": "phone",
      "message": "Invalid phone number format"
    }
  ]
}
```

### Common Error Status Codes

| Status Code | Meaning | When It Occurs |
|-------------|---------|----------------|
| 400 | Bad Request | Invalid request body, validation failure |
| 401 | Unauthorized | Missing or invalid access token, invalid Google token |
| 403 | Forbidden | Account banned, account inactive |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Email/phone already registered |
| 422 | Unprocessable Entity | Validation errors (detailed in `errors` array) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server/database error |

### Validation Errors (422)

When validation fails, the response includes detailed field-level errors:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Invalid phone number format"
    },
    {
      "field": "otp",
      "message": "OTP must be 6 digits"
    }
  ]
}
```

---

## Rate Limiting

### Auth Rate Limiter (General)

Applied to all `/auth/*` endpoints except `/auth/phone/send-otp`.

**Limit:** 200 requests per 2 minutes (120 seconds)

**Response when exceeded:**
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, please try again later."
}
```

### OTP Rate Limiter (Strict)

Applied only to `/auth/phone/send-otp`.

**Limit:** 3 requests per 15 minutes (900 seconds)

**Purpose:** Prevent SMS abuse

**Response when exceeded:**
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many OTP requests, please try again later."
}
```

---

## Environment Variables

### Required for Google OAuth

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google/callback"

# JWT Secrets
JWT_ACCESS_SECRET="<your-access-secret>"
JWT_REFRESH_SECRET="<your-refresh-secret>"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
```

### Optional (for Phone Verification)

```bash
# MSG91 SMS Service
MSG91_AUTH_KEY="<your-msg91-auth-key>"
MSG91_SENDER_ID="<your-sender-id>"
MSG91_TEMPLATE_ID="<your-template-id>"
```

**Note:** If MSG91 is not configured, phone verification endpoints will fail with 500 error.

---

## Integration Examples

### React Native - Google Sign-In (Recommended)

#### Using `react-native-inappbrowser-reborn` (Authorization Code Flow)

This is the **recommended** approach as it uses the standard OAuth 2.0 Authorization Code flow, which is more robust and less prone to "invalid_request" errors than the ID Token flow.

```typescript
import InAppBrowser from 'react-native-inappbrowser-reborn';
import axios from 'axios';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import * as Keychain from 'react-native-keychain';

const handleGoogleSignIn = async () => {
  // 1. Configure Redirect URI (Must match Google Cloud Console)
  const redirectUri = 'com.chhattisgarhshaadi.app://oauth2redirect';
  
  // 2. Construct Google Auth URL
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=openid email profile` +
    `&access_type=offline`; // Request refresh token
  
  try {
    // 3. Open In-App Browser
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.openAuth(googleAuthUrl, redirectUri, {
        // iOS Properties
        dismissButtonStyle: 'cancel',
        preferredBarTintColor: '#453AA4',
        preferredControlTintColor: 'white',
        readerMode: false,
        animated: true,
        modalPresentationStyle: 'fullScreen',
        modalTransitionStyle: 'coverVertical',
        modalEnabled: true,
        enableBarCollapsing: false,
        // Android Properties
        showTitle: true,
        toolbarColor: '#6200EE',
        secondaryToolbarColor: 'black',
        navigationBarColor: 'black',
        navigationBarDividerColor: 'white',
        enableUrlBarHiding: true,
        enableDefaultShare: true,
        forceCloseOnRedirection: false,
      });
      
      // 4. Handle Result
      if (result.type === 'success' && result.url) {
        const code = new URL(result.url).searchParams.get('code');
        
        if (code) {
          // 5. Exchange Code for Tokens (Backend Call)
          const response = await axios.post('https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google', {
            authorizationCode: code,
            redirectUri: redirectUri,
            deviceInfo: {
              deviceId: DeviceInfo.getUniqueId(),
              deviceName: await DeviceInfo.getDeviceName(),
              deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            }
          });
          
          const { accessToken, refreshToken, user, isNewUser } = response.data.data;
          
          // 6. Store Tokens Securely
          await Keychain.setGenericPassword('accessToken', accessToken, { service: 'accessToken' });
          await Keychain.setGenericPassword('refreshToken', refreshToken, { service: 'refreshToken' });
          
          // 7. Navigate
          if (isNewUser) {
            navigation.navigate('ProfileCreation');
          } else {
            navigation.navigate('Home');
          }
        }
      }
    } else {
      // Fallback to Linking.openURL if InAppBrowser not available
      // Linking.openURL(googleAuthUrl);
    }
  } catch (error) {
    console.error('Auth error:', error);
  }
};
```

#### Using `@react-native-google-signin/google-signin` (Legacy/Alternative)

Use this if you prefer the native Google Sign-In button experience.

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Google Cloud Console
  offlineAccess: true,
});

// Sign in and get ID token
const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    
    // Send ID token to backend
    const response = await axios.post('https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/google', {
      idToken: tokens.idToken,
      deviceInfo: {
        deviceId: DeviceInfo.getUniqueId(),
        deviceName: await DeviceInfo.getDeviceName(),
        deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      }
    });
    
    // ... handle response
  } catch (error) {
    console.error('Sign-in error:', error);
  }
};
```

### Token Refresh Logic

```typescript
import axios from 'axios';
import * as Keychain from 'react-native-keychain';

// Create axios instance
const apiClient = axios.create({
  baseURL: 'https://chhattisgarhshadi-backend.onrender.com/api/v1',
});

// Request interceptor - add access token
apiClient.interceptors.request.use(async (config) => {
  const credentials = await Keychain.getGenericPassword({ service: 'accessToken' });
  if (credentials) {
    config.headers.Authorization = `Bearer ${credentials.password}`;
  }
  return config;
});

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and not already retried, refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshCreds = await Keychain.getGenericPassword({ service: 'refreshToken' });
        
        if (refreshCreds) {
          const response = await axios.post(
            'https://chhattisgarhshadi-backend.onrender.com/api/v1/auth/refresh',
            { refreshToken: refreshCreds.password }
          );
          
          const { accessToken, refreshToken } = response.data.data;
          
          // Update stored tokens
          await Keychain.setGenericPassword('accessToken', accessToken, { service: 'accessToken' });
          await Keychain.setGenericPassword('refreshToken', refreshToken, { service: 'refreshToken' });
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        await Keychain.resetGenericPassword({ service: 'accessToken' });
        await Keychain.resetGenericPassword({ service: 'refreshToken' });
        // Navigate to login
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Security Best Practices

1. **Never log or expose JWTs** in production
2. **Store tokens in secure storage only:**
   - React Native: Use `react-native-keychain`
   - Web: Use `httpOnly` cookies (not localStorage)
3. **Implement token refresh** before access token expires
4. **Clear tokens immediately on logout**
5. **Use HTTPS** in production (already enforced on Render)
6. **Validate all user inputs** (handled server-side)
7. **Monitor rate limit headers** to avoid being blocked

---

## Testing

### Health Check

Before testing auth, verify the API is running:

```bash
curl https://chhattisgarhshadi-backend.onrender.com/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": { "status": "✅ Connected" },
    ...
  }
}
```

---

## Support

For issues or questions:
- **Backend Repository:** [Your GitHub Repo]
- **API Base URL:** `https://chhattisgarhshadi-backend.onrender.com/api/v1`
- **Google Cloud Console:** [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)

---

**Last Updated:** November 20, 2025  
**API Version:** v1.0.0
