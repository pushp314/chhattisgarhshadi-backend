# Chhattisgarh Shadi Backend API Documentation

**Production API Base URL:** `https://chhattisgarhshadi-backend.onrender.com/api/v1`

**Version:** 1.0.0

**Last Updated:** November 14, 2025

---

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Real-time Features (Socket.io)](#real-time-features)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [File Uploads](#file-uploads)
8. [Environment Variables](#environment-variables)

---

## 🚀 Getting Started

### Base URLs

- **Production:** `https://chhattisgarhshadi-backend.onrender.com/api/v1`
- **Development:** `http://localhost:8080/api/v1`
- **Android Emulator:** `http://10.0.2.2:8080/api/v1`

### Health Check

Check if the API is running:

```bash
GET https://chhattisgarhshadi-backend.onrender.com/api/v1/health
```

**Response:**
```json
{
  "success": true,
  "message": "✅ API is healthy and running",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": "✅ Connected",
    "socket": "✅ Running",
    "firebase": "✅ Configured",
    "aws": "⚠️ Not configured",
    "msg91": "⚠️ Not configured",
    "razorpay": "⚠️ Not configured"
  }
}
```

### Welcome Message

Visit the root URL to see API status:

```bash
GET https://chhattisgarhshadi-backend.onrender.com/
```

**Response:**
```json
{
  "success": true,
  "message": "🎉 Chhattisgarh Shadi Backend API",
  "version": "1.0.0",
  "status": "running",
  "timestamp": "2025-11-14T10:30:00.000Z",
  "endpoints": {
    "health": "/api/v1/health",
    "auth": "/api/v1/auth/*",
    "users": "/api/v1/users/*",
    "profiles": "/api/v1/profiles/*",
    "matches": "/api/v1/matches/*",
    "messages": "/api/v1/messages/*",
    "notifications": "/api/v1/notifications/*",
    "payments": "/api/v1/payments/*",
    "uploads": "/api/v1/upload/*",
    "admin": "/api/v1/admin/*"
  },
  "documentation": "https://github.com/pushp314/chhattisgarhshadi-backend/blob/main/API_DOCUMENTATION.md"
}
```

---

## 🔐 Authentication

All authentication uses **Google OAuth 2.0** with JWT tokens. No password-based authentication.

### 1. Google Sign-In (Mobile OAuth Flow)

**Endpoint:** `POST /api/v1/auth/google`

**Request Body:**
```json
{
  "authorizationCode": "GOOGLE_AUTH_CODE",
  "redirectUri": "http://localhost:8080/api/v1/auth/google/callback"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "isActive": true,
      "isBanned": false,
      "role": "USER",
      "preferredLanguage": "EN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

### 2. Refresh Access Token

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### 3. Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Using Authentication

Include the access token in all authenticated requests:

```bash
curl -H "Authorization: Bearer <access-token>" \
  https://chhattisgarhshadi-backend.onrender.com/api/v1/users/me
```

---

## 📡 API Endpoints

### Auth Routes (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/google` | Google OAuth login | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | Logout user | Yes |

### User Routes (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user | Yes |
| PUT | `/me` | Update current user | Yes |
| POST | `/phone/send-otp` | Send OTP for phone verification | Yes |
| POST | `/phone/verify-otp` | Verify OTP | Yes |
| POST | `/fcm-token` | Register FCM token for push notifications | Yes |
| DELETE | `/me` | Soft delete account | Yes |

### Profile Routes (`/api/v1/profiles`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user's profile | Yes |
| POST | `/me` | Create profile | Yes |
| PUT | `/me` | Update profile | Yes |
| GET | `/:id` | Get specific profile | Yes |
| POST | `/photos` | Add profile photos | Yes |
| DELETE | `/photos/:photoId` | Delete photo | Yes |
| PUT | `/photos/:photoId/primary` | Set primary photo | Yes |

### Match Routes (`/api/v1/matches`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get match recommendations | Yes |
| GET | `/sent` | Get sent match requests | Yes |
| GET | `/received` | Get received match requests | Yes |
| POST | `/:profileId/request` | Send match request | Yes |
| PUT | `/:matchId/accept` | Accept match request | Yes |
| PUT | `/:matchId/reject` | Reject match request | Yes |
| POST | `/:profileId/shortlist` | Add to shortlist | Yes |
| DELETE | `/shortlist/:profileId` | Remove from shortlist | Yes |

### Message Routes (`/api/v1/messages`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/conversations` | Get all conversations | Yes |
| GET | `/conversation/:userId` | Get messages with user | Yes |
| POST | `/send` | Send message | Yes |
| PUT | `/:messageId/read` | Mark message as read | Yes |
| DELETE | `/:messageId` | Delete message | Yes |

### Notification Routes (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all notifications | Yes |
| GET | `/unread-count` | Get unread count | Yes |
| PUT | `/:id/read` | Mark as read | Yes |
| PUT | `/read-all` | Mark all as read | Yes |
| DELETE | `/:id` | Delete notification | Yes |

### Payment Routes (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/plans` | Get subscription plans | Yes |
| POST | `/create-order` | Create Razorpay order | Yes |
| POST | `/verify` | Verify payment | Yes |
| GET | `/subscription` | Get current subscription | Yes |
| GET | `/history` | Get payment history | Yes |

### Upload Routes (`/api/v1/upload`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/profile-photo` | Upload single profile photo | Yes |
| POST | `/profile-photos` | Upload multiple photos (max 5) | Yes |
| POST | `/document` | Upload verification document | Yes |

### Admin Routes (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Get all users | Admin |
| PUT | `/users/:id/verify` | Verify user profile | Admin |
| PUT | `/users/:id/ban` | Ban user | Admin |
| GET | `/agents` | Get all agents | Admin |
| POST | `/agents` | Create agent | Admin |
| GET | `/statistics` | Get platform statistics | Admin |

---

## 🔄 Real-time Features (Socket.io)

### Connection

Connect to Socket.io server using JWT token:

```javascript
import io from 'socket.io-client';

const socket = io('https://chhattisgarhshadi-backend.onrender.com', {
  auth: { token: 'your-jwt-access-token' },
  transports: ['websocket'],
});
```

### Events

#### Client to Server

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ receiverId: string, content: string }` | Send message |
| `message:typing` | `{ receiverId: string }` | User is typing |
| `message:read` | `{ messageId: string }` | Mark message as read |

#### Server to Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message:received` | `Message object` | New message received |
| `message:sent` | `Message object` | Message sent confirmation |
| `user:online` | `{ userId: string }` | User came online |
| `user:offline` | `{ userId: string }` | User went offline |
| `notification:received` | `Notification object` | New notification |
| `match:request` | `Match object` | New match request |

### Example Usage

```javascript
// Listen for messages
socket.on('message:received', (message) => {
  console.log('New message:', message);
});

// Send message
socket.emit('message:send', {
  receiverId: 'user-uuid',
  content: 'Hello!'
});

// Check online status
socket.on('user:online', ({ userId }) => {
  console.log(`User ${userId} is online`);
});
```

---

## ⚠️ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message here",
  "statusCode": 400,
  "errors": ["Validation error 1", "Validation error 2"]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable (S3, Razorpay, MSG91 not configured) |

### Common Errors

#### Invalid Token
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "statusCode": 401
}
```

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    "Email is required",
    "Age must be between 18 and 100"
  ]
}
```

#### Service Unavailable
```json
{
  "success": false,
  "message": "AWS S3 is not configured. File upload is unavailable.",
  "statusCode": 503
}
```

---

## 🛡️ Rate Limiting

### Auth Routes
- **Limit:** 10 requests per 15 minutes per IP
- **Applies to:** `/api/v1/auth/*`

### General API Routes
- **Limit:** 100 requests per 15 minutes per IP
- **Applies to:** All other routes

### Rate Limit Response

```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "statusCode": 429
}
```

---

## 📤 File Uploads

### Supported Formats
- **Images:** JPEG, PNG, WebP
- **Documents:** PDF, JPEG, PNG

### Size Limits
- **Profile Photos:** 5MB per file, max 5 files
- **Documents:** 10MB per file

### Upload Example

```javascript
const formData = new FormData();
formData.append('photo', {
  uri: imageUri,
  type: 'image/jpeg',
  name: 'profile.jpg',
});

const response = await fetch('https://chhattisgarhshadi-backend.onrender.com/api/v1/upload/profile-photo', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'multipart/form-data',
  },
  body: formData,
});
```

### Upload Response

```json
{
  "success": true,
  "message": "Photo uploaded successfully",
  "data": {
    "id": "media-uuid",
    "url": "https://s3.amazonaws.com/bucket/path/to/image.jpg",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/path/to/thumbnail.jpg",
    "type": "PROFILE_PHOTO",
    "isPublic": true
  }
}
```

---

## 🔧 Environment Variables

### Required for Production

```env
# Database
DATABASE_URL="postgresql://..."

# JWT Secrets (minimum 32 characters)
JWT_ACCESS_SECRET="your-secure-access-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# CORS
CORS_ORIGIN="*"  # For mobile apps

# Node Environment
NODE_ENV="production"
```

### Optional Services

```env
# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET="your-bucket-name"

# MSG91 (for SMS)
MSG91_AUTH_KEY="your-msg91-key"
MSG91_SENDER_ID="your-sender-id"
MSG91_TEMPLATE_ID="your-template-id"

# Razorpay (for payments)
RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_KEY_SECRET="your-razorpay-secret"

# Firebase (for push notifications)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"
```

---

## 📱 React Native Integration

### Install Dependencies

```bash
npm install axios react-native-inappbrowser-reborn socket.io-client @react-native-async-storage/async-storage
```

### API Service Setup

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://chhattisgarhshadi-backend.onrender.com/api/v1';

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

---

## 🧪 Testing

### Test Health Check

```bash
curl https://chhattisgarhshadi-backend.onrender.com/api/v1/health
```

### Test with Token

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://chhattisgarhshadi-backend.onrender.com/api/v1/users/me
```

---

## 📚 Additional Resources

- [Google OAuth Setup Guide](./GOOGLE_CLOUD_SETUP.md)
- [React Native Setup Guide](./REACT_NATIVE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [GitHub Repository](https://github.com/pushp314/chhattisgarhshadi-backend)

---

## 🆘 Support

For issues or questions:
1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review [React Native Setup](./REACT_NATIVE_SETUP.md)
3. Check [Google OAuth Guide](./GOOGLE_CLOUD_SETUP.md)

---

**Last Updated:** November 14, 2025
