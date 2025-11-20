---

## AUTHENTICATION

This section details the endpoints for user authentication, including registration, login, session refreshing, and phone verification.

### 1. Google Authentication

-   **Endpoint**: `POST /api/v1/auth/google`
-   **Rate Limit**: Yes (Strict)
-   **Description**: Authenticates a user via their Google account. This single endpoint supports both a web-based OAuth 2.0 flow (using an authorization code) and a mobile/legacy flow (using an ID token). If the user does not exist, a new account is created.

**Request Body**

Provide *either* an `authorizationCode` (for web flow) *or* an `idToken` (for mobile flow).

```json
{
  "authorizationCode": "4/0AY0e-g7...",
  "redirectUri": "https://your-frontend.com/auth/callback",
  "agentCode": "AGENT123", // Optional: For tracking sign-ups via agents
  "deviceInfo": { 
    "deviceId": "ABC-123", 
    "platform": "Android"
  }
}
```

**OR**

```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsI...",
  "agentCode": "AGENT123", // Optional
  "deviceInfo": { 
    "deviceId": "XYZ-789", 
    "platform": "iOS"
  }
}
```

**Validation**

-   `authorizationCode`: `string` (Required if `idToken` is not present)
-   `redirectUri`: `string` (URL, Required if using `authorizationCode`)
-   `idToken`: `string` (Required if `authorizationCode` is not present)
-   `agentCode`: `string` (Optional, max 20 chars)
-   `deviceInfo`: `object` (Optional, for session tracking)

**Response (200 OK)**

Returns the user object along with access and refresh tokens.

```json
{
    "success": true,
    "message": "Authentication successful",
    "data": {
        "user": { ... },
        "accessToken": "...",
        "refreshToken": "..."
    }
}
```

### 2. Google Authentication Callback

-   **Endpoint**: `GET /api/v1/auth/google/callback`
-   **Description**: This is the server-side redirect URI for the web-based Google OAuth 2.0 flow. It is not intended to be called directly by a client application. The flow is as follows:
    1.  Your front-end redirects the user to Google's OAuth consent screen.
    2.  After user approval, Google redirects back to this endpoint (`/api/v1/auth/google/callback`) with a `code`.
    3.  The server handles this callback, exchanges the `code` for tokens, and typically redirects the user back to the front-end with the session tokens.

### 3. Refresh Access Token

-   **Endpoint**: `POST /api/v1/auth/refresh`
-   **Rate Limit**: Yes
-   **Description**: Generates a new `accessToken` using a valid `refreshToken`.

**Request Body**

```json
{
  "refreshToken": "..."
}
```

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Token refreshed successfully",
    "data": {
        "accessToken": "...",
        "refreshToken": "..." // A new refresh token may be returned
    }
}
```

### 4. Logout

-   **Endpoint**: `POST /api/v1/auth/logout`
-   **Auth Required**: Yes
-   **Rate Limit**: Yes
-   **Description**: Logs the user out. It can invalidate a single session or all sessions for the user.

**Request Body**

-   To log out of the **current device** only, provide the `refreshToken`.
-   To log out of **all devices**, omit the `refreshToken`.

```json
{
  "refreshToken": "..." // Optional
}
```

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Logout successful"
}
```

### 5. Send Phone Verification OTP

-   **Endpoint**: `POST /api/v1/auth/phone/send-otp`
-   **Auth Required**: Yes
-   **Rate Limit**: Yes (Stricter OTP limit)
-   **Description**: Sends a 6-digit One-Time Password (OTP) to the user's provided phone number.

**Request Body**

```json
{
  "phone": "9876543210",
  "countryCode": "+91" // Optional
}
```

**Validation**
- `phone`: `string` (Required, must be a valid 10-digit Indian number)

**Response (200 OK)**

```json
{
    "success": true,
    "message": "OTP sent successfully to 9876543210"
}
```

### 6. Verify Phone OTP

-   **Endpoint**: `POST /api/v1/auth/phone/verify-otp`
-   **Auth Required**: Yes
-   **Rate Limit**: Yes
-   **Description**: Verifies the OTP sent to the user's phone. If successful, the user's `phone` and `isPhoneVerified` fields are updated.

**Request Body**

```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Validation**
- `phone`: `string` (Required, must be a valid 10-digit Indian number)
- `otp`: `string` (Required, must be 6 digits)

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Phone number verified successfully"
}
```
