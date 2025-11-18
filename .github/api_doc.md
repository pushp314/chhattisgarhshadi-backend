# Chhattisgarh Shaadi - Backend API Documentation

**Audience:** React Native Developer
**Version:** 1.0.0

This document provides a complete guide for integrating with the Chhattisgarh Shaadi backend API. All examples use **Axios** and assume token management is handled via **AsyncStorage**.

## Table of Contents
1.  [Getting Started](#getting-started)
2.  [Authentication Flow](#authentication-flow)
3.  [Standard API Responses](#standard-api-responses)
4.  [API Endpoints](#api-endpoints)
    *   [Auth](#auth)
    *   [User & Profile](#user--profile)
    *   [Education](#education)
    *   [Occupation](#occupation)
    *   [Partner Preferences](#partner-preferences)
    *   [Matching](#matching)
    *   [Messaging](#messaging)
    *   [Shortlist](#shortlist)
    *   [Block System](#block-system)
    *   [Reporting](#reporting)
    *   [File Uploads (S3)](#file-uploads-s3)
    *   [Payments (Razorpay)](#payments-razorpay)
5.  [Admin Endpoints](#admin-endpoints)

---

## Getting Started

### Base URL
All API endpoints documented here are prefixed with:
```
/api/v1
```

### Axios Configuration
Your React Native application should use a centralized Axios instance with interceptors to automatically handle API authorization and token refreshing.

**`api.service.ts` (Recommended Setup)**
```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'https://your-production-api-url.com/api/v1', // Replace with your actual API URL
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
            // Logout logic here
            return Promise.reject(error);
        }
        
        const { data } = await axios.post('https://your-production-api-url.com/api/v1/auth/refresh-tokens', {
          refreshToken,
        });
        
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;

        await AsyncStorage.setItem('accessToken', newAccessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Session expired. Please login again.', refreshError);
        // Clear tokens and redirect to login screen
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Authentication Flow

Authentication is handled via JWT. You can log in using **Google** or a **Phone Number + OTP**.

1.  **Login:** Use `POST /auth/google` or `POST /auth/verify-otp` to authenticate.
2.  **Store Tokens:** On success, the API returns an `accessToken` (expires in 15 mins) and a `refreshToken` (expires in 7 days). Store both securely in `AsyncStorage`.
3.  **Authorize Requests:** The Axios interceptor will automatically attach the `accessToken` to the `Authorization: Bearer <token>` header for all requests to protected endpoints.
4.  **Refresh Session:** If the `accessToken` expires, the API will return `401 Unauthorized`. The Axios interceptor will automatically catch this, call `POST /auth/refresh-tokens` with the `refreshToken`, get new tokens, store them, and retry the original failed request.
5.  **Logout:** Call `POST /auth/logout` with your `refreshToken` to invalidate the session on the backend. Then, clear the tokens from `AsyncStorage`.

---

## Standard API Responses

Every API response, whether success or error, follows a consistent JSON structure. The Axios response data will be `response.data`.

**Success Response (`2xx` status code)**
```json
{
  "statusCode": 200,
  "data": { ... }, 
  "message": "Success",
  "success": true
}
```

**Error Response (`4xx` or `5xx` status code)**
```json
{
  "statusCode": 400,
  "message": "Validation Error: 'idToken' is required",
  "errors": ["'idToken' is required"],
  "stack": "...", 
  "success": false
}
```

---

## API Endpoints

### Auth

#### 1. Login with Google
- **Endpoint:** `POST /auth/google`
- **Auth:** Not Required
- **Middleware:** `rateLimiter`

**Request Body**
```json
{
  "idToken": "string"
}
```
| Field | Type | Validation | Description |
|---|---|---|---|
| `idToken` | `string` | **Required** | The `idToken` received from the Google Sign-In flow on the client. |

**Success Response (200 OK)**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "cl...",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": null,
      "role": "USER",
      "isEmailVerified": true,
      ...
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  },
  "message": "User logged in successfully",
  "success": true
}
```

**React Native (Axios) Example**
```typescript
async function loginWithGoogle(idToken: string) {
  try {
    const response = await api.post('/auth/google', { idToken });
    const { user, tokens } = response.data.data;
    await AsyncStorage.setItem('accessToken', tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
    // Navigate to home screen
  } catch (error) {
    console.error('Google login failed:', error.response.data);
  }
}
```

#### 2. Send Login/Register OTP
- **Endpoint:** `POST /auth/send-otp`
- **Auth:** Not Required
- **Middleware:** `rateLimiter`

**Request Body**
```json
{
  "phone": "string"
}
```
| Field | Type | Validation | Description |
|---|---|---|---|
| `phone` | `string` | **Required**, valid phone number | The user's phone number to receive the OTP. |

**Success Response (200 OK)**
```json
{
  "statusCode": 200,
  "data": null,
  "message": "OTP sent successfully",
  "success": true
}
```

**React Native (Axios) Example**
```typescript
await api.post('/auth/send-otp', { phone: '919876543210' });
// Show OTP input screen
```

#### 3. Verify OTP and Login/Register
- **Endpoint:** `POST /auth/verify-otp`
- **Auth:** Not Required
- **Middleware:** `rateLimiter`

**Request Body**
```json
{
  "phone": "string",
  "otp": "string"
}
```

**Success Response (200 OK)**
Same as Google Login, returns `user` and `tokens`.

**React Native (Axios) Example**
```typescript
async function verifyOtp(phone: string, otp: string) {
  try {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    const { user, tokens } = response.data.data;
    await AsyncStorage.setItem('accessToken', tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
    // Navigate to home screen
  } catch (error) {
    console.error('OTP verification failed:', error.response.data);
  }
}
```

#### 4. Refresh Access Token
- **Endpoint:** `POST /auth/refresh-tokens`
- **Auth:** Not Required

**Request Body**
```json
{
  "refreshToken": "string"
}
```

**Success Response (200 OK)**
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "message": "Tokens refreshed successfully",
  "success": true
}
```
**Usage Note:** This endpoint is typically handled automatically by the Axios response interceptor.

#### 5. Logout
- **Endpoint:** `POST /auth/logout`
- **Auth:** Not Required

**Request Body**
```json
{
  "refreshToken": "string"
}
```

**Success Response (204 No Content)**
The server returns a success status with no body.

**React Native (Axios) Example**
```typescript
async function logout() {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (refreshToken) {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout failed on server:', error);
    }
  }
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  // Navigate to login screen
}
```

---
### User & Profile

#### 1. Get My User Details
- **Endpoint:** `GET /users/me`
- **Auth:** **Required**

**Success Response (200 OK)**
Returns the full `User` object for the authenticated user from the database.
```json
{
  "statusCode": 200,
  "data": {
    "id": "cl...",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "919876543210",
    "role": "USER",
    "isEmailVerified": true,
    "profileCompleteness": 85,
    "profile": { ... } // Nested Profile object
  },
  "message": "User details fetched successfully",
  "success": true
}
```

**React Native (Axios) Example**
```typescript
const response = await api.get('/users/me');
const currentUser = response.data.data;
```

#### 2. Update My User Details
- **Endpoint:** `PUT /users/me`
- **Auth:** **Required**

**Request Body**
All fields are optional. Only provide the ones you want to update.
```json
{
  "name": "string",
  "email": "string (email format)"
}
```

**Success Response (200 OK)**
Returns the updated `User` object.

**React Native (Axios) Example**
```typescript
const response = await api.put('/users/me', { name: 'Johnny Doe' });
const updatedUser = response.data.data;
```

#### 3. Get User Profile by ID
- **Endpoint:** `GET /users/:id`
- **Auth:** **Required**
- **Middleware:** `requireCompleteProfile`, `requireSubscription` (may apply to certain fields)

**Path Params**
| Param | Type | Description |
|---|---|---|
| `id` | `string` | The ID of the user whose profile you want to view. |

**Success Response (200 OK)**
Returns a public-facing version of the user's profile. Some fields might be omitted based on the viewing user's subscription status or the profile owner's privacy settings.

**Business Logic:**
- This endpoint is used to view other people's profiles.
- Triggers a `ProfileView` event and may create a notification for the profile owner.

**React Native (Axios) Example**
```typescript
const response = await api.get('/users/some-user-id');
const userProfile = response.data.data;
```

#### 4. Update My Profile
- **Endpoint:** `PUT /profile`
- **Auth:** **Required**

**Request Body**
This is a large, flexible endpoint. You can send any subset of the full `Profile` model fields to update them.
```json
{
  "bio": "A short bio about myself...",
  "maritalStatus": "NEVER_MARRIED", // Enum: NEVER_MARRIED, DIVORCED, WIDOWED
  "height": 175, // in cm
  "weight": 70, // in kg
  "diet": "VEGETARIAN", // Enum
  "religion": "HINDU",
  "caste": "Brahmin",
  "familyDetails": {
    "fatherStatus": "Employed",
    "motherStatus": "Homemaker",
    "siblings": { "brothers": 1, "sisters": 1 }
  },
  // ... and many more fields from the Prisma schema
}
```

**Success Response (200 OK)**
Returns the complete, updated `Profile` object.

**React Native (Axios) Example**
```typescript
const response = await api.put('/profile', {
  bio: 'Updated my bio!',
  height: 180,
});
const updatedProfile = response.data.data;
```

---
### Education

All endpoints under `/education` require authentication (`auth` middleware).

#### 1. Add Education Record
- **Endpoint:** `POST /education`
- **Auth:** **Required**

**Request Body**
```json
{
  "degree": "string",
  "college": "string",
  "startYear": "integer",
  "endYear": "integer"
}
```

**Success Response (201 Created)**
Returns the newly created `Education` object.

**React Native (Axios) Example**
```typescript
await api.post('/education', {
  degree: 'Bachelor of Technology',
  college: 'National Institute of Technology',
  startYear: 2018,
  endYear: 2022,
});
```

#### 2. Get My Education Records
- **Endpoint:** `GET /education`
- **Auth:** **Required**

**Success Response (200 OK)**
Returns an array of the user's `Education` records.
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "edu_...",
      "degree": "B.Tech",
      ...
    }
  ],
  ...
}
```

---
### Occupation

All endpoints under `/occupation` require authentication (`auth` middleware). The structure is identical to `/education` (Create, Get, Update, Delete).

#### 1. Add Occupation Record
- **Endpoint:** `POST /occupation`
- **Auth:** **Required**

**Request Body**
```json
{
  "jobTitle": "string",
  "company": "string",
  "annualIncome": "integer"
}
```

---
### Partner Preferences

#### 1. Get My Partner Preferences
- **Endpoint:** `GET /partner-preference`
- **Auth:** **Required**

**Success Response (200 OK)**
Returns the user's `PartnerPreference` object.

#### 2. Create/Update My Partner Preferences
- **Endpoint:** `PUT /partner-preference`
- **Auth:** **Required**

**Request Body**
A flexible object with all preference fields. All are optional.
```json
{
  "minAge": 25,
  "maxAge": 30,
  "minHeight": 160,
  "maxHeight": 185,
  "religions": ["HINDU"],
  "diets": ["VEGETARIAN", "EGGETARIAN"]
}
```

---
### Matching

#### 1. Get Matches
- **Endpoint:** `GET /matches`
- **Auth:** **Required**
- **Middleware:** `requireCompleteProfile`

**Business Logic:**
- You can only get matches if your profile is sufficiently complete.
- The matching algorithm runs on the backend based on your saved partner preferences.

**Query Params**
| Param | Type | Description |
|---|---|---|
| `page` | `integer` | Page number for pagination (Default: 1). |
| `limit` | `integer` | Number of results per page (Default: 20). |

**Success Response (200 OK)**
Returns a paginated list of user profiles that match the criteria.

**React Native (Axios) Example**
```typescript
const response = await api.get('/matches?page=1&limit=10');
const matches = response.data.data; // This will be an array of user profiles
```

---
### Messaging

**Business Logic:**
- All messaging endpoints require the user to be **authenticated**, have a **complete profile**, and have an **active subscription**. (`auth`, `requireCompleteProfile`, `requireSubscription`).
- Messaging is also handled in real-time via WebSockets (Socket.io). These REST endpoints are for fetching history and sending initial messages.

#### 1. Get Message History
- **Endpoint:** `GET /messages/:receiverId`
- **Auth:** **Required**
- **Middleware:** `requireCompleteProfile`, `requireSubscription`
