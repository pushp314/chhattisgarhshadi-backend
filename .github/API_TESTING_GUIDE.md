# API Testing Guide - Frontend Compatibility Verification

## ✅ All Fixes Applied

The following changes have been implemented to ensure 100% compatibility with the React Native frontend:

1. ✅ **Field Names Fixed**: `toUserId` → `receiverId` in match/message endpoints
2. ✅ **HTTP Methods Fixed**: `PUT` → `POST` for accept/reject match endpoints
3. ✅ **Message Field Added**: Match requests now accept optional `message` field
4. ✅ **Socket Events Fixed**: `typing:start` → `typing:started`, `typing:stop` → `typing:stopped`
5. ✅ **Auth Response Enhanced**: Added `firstName`, `lastName`, `isActive`, timestamps
6. ✅ **Media Field Mapped**: `isDefault` → `isProfilePicture` in profile responses
7. ✅ **Join Event Added**: Socket now handles explicit 'join' event from frontend

---

## 🧪 Testing with Postman/Thunder Client

### Setup

1. **Import Base URL**: `http://localhost:8080/api/v1`
2. **Create Environment Variable**: `accessToken` (set after login)
3. **Set Authorization Header**: `Bearer {{accessToken}}`

---

## Test Sequence

### 1. Authentication Flow ✅

#### 1.1 Google Sign-In
```http
POST /auth/google
Content-Type: application/json

{
  "idToken": "google_id_token_here",
  "deviceInfo": {
    "deviceId": "test-device-123",
    "deviceName": "Test iPhone",
    "deviceType": "IOS",
    "userAgent": "TestApp/1.0"
  }
}
```

**Expected Response:**
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
      "profilePicture": "https://...",
      "role": "USER",
      "isPhoneVerified": false,
      "isActive": true,
      "preferredLanguage": "HI",
      "createdAt": "2025-11-14T...",
      "updatedAt": "2025-11-14T...",
      "profile": null
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "expiresIn": "15m",
    "isNewUser": true
  },
  "message": "Account created successfully"
}
```

**✅ Verify:**
- [ ] `firstName` and `lastName` fields present (null for new user)
- [ ] `isActive` field present
- [ ] `createdAt` and `updatedAt` present
- [ ] `accessToken` and `refreshToken` returned

---

#### 1.2 Send Phone OTP
```http
POST /auth/phone/send-otp
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "phone": "9876543210",
  "countryCode": "+91"
}
```

**Expected Response:**
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

---

#### 1.3 Verify Phone OTP
```http
POST /auth/phone/verify-otp
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": null,
  "message": "Phone verified successfully"
}
```

---

#### 1.4 Token Refresh
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token",
    "expiresIn": "15m"
  },
  "message": "Token refreshed successfully"
}
```

---

### 2. Profile Management ✅

#### 2.1 Create Profile
```http
POST /profiles
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "firstName": "Ramesh",
  "lastName": "Kumar",
  "dateOfBirth": "1990-01-15T00:00:00.000Z",
  "gender": "MALE",
  "maritalStatus": "NEVER_MARRIED",
  "religion": "HINDU",
  "caste": "General",
  "motherTongue": "CHHATTISGARHI",
  "country": "India",
  "state": "Chhattisgarh",
  "city": "Raipur",
  "height": 175,
  "speaksChhattisgarhi": true,
  "nativeDistrict": "Raipur",
  "bio": "Looking for a life partner"
}
```

**✅ Verify:**
- [ ] Profile created successfully
- [ ] Returns profile object with all fields
- [ ] `profileCompleteness` calculated

---

#### 2.2 Get My Profile
```http
GET /profiles/me
Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "userId": 1,
    "firstName": "Ramesh",
    "lastName": "Kumar",
    "dateOfBirth": "1990-01-15",
    "gender": "MALE",
    "age": 35,
    "media": [
      {
        "id": 1,
        "url": "/uploads/profiles/1/original/photo.jpg",
        "thumbnailUrl": "/uploads/profiles/1/thumbnails/photo.jpg",
        "type": "PROFILE_PHOTO",
        "isProfilePicture": true
      }
    ],
    "isVerified": false,
    "isActive": true,
    "profileCompleteness": 65,
    "createdAt": "2025-11-14T...",
    "updatedAt": "2025-11-14T..."
  }
}
```

**✅ Verify:**
- [ ] `media` array has `isProfilePicture` field (not `isDefault`)
- [ ] `isVerified` and `isActive` present
- [ ] `age` calculated from dateOfBirth

---

#### 2.3 Upload Profile Photo
```http
POST /uploads/profile-photo
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

photo: [select file]
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "media": {
      "id": 1,
      "url": "/uploads/profiles/1/original/photo.jpg",
      "thumbnailUrl": "/uploads/profiles/1/thumbnails/photo.jpg",
      "type": "PROFILE_PHOTO",
      "isProfilePicture": true
    }
  },
  "message": "Photo uploaded successfully"
}
```

---

### 3. Match Requests ✅ **CRITICAL FIXES APPLIED**

#### 3.1 Send Match Request
```http
POST /matches
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "receiverId": 2,
  "message": "Hi, I would like to connect with you."
}
```

**✅ Verify:**
- [ ] Uses `receiverId` (not `toUserId`)
- [ ] Accepts optional `message` field
- [ ] Returns match object with status PENDING

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "status": "PENDING",
    "message": "Hi, I would like to connect with you.",
    "createdAt": "2025-11-14T..."
  },
  "message": "Match request sent successfully"
}
```

---

#### 3.2 Get Received Match Requests
```http
GET /matches/received?page=1&limit=10&status=PENDING
Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "matches": [
      {
        "id": 1,
        "status": "PENDING",
        "message": "Hi, I would like to connect with you.",
        "sender": {
          "id": 1,
          "profilePicture": "...",
          "role": "USER",
          "profile": {
            "firstName": "Ramesh",
            "lastName": "Kumar"
          }
        },
        "createdAt": "2025-11-14T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

#### 3.3 Accept Match Request **[HTTP METHOD FIXED]**
```http
POST /matches/1/accept
Authorization: Bearer {{accessToken}}
```

**✅ Verify:**
- [ ] Uses `POST` method (not `PUT`)
- [ ] Returns updated match with status ACCEPTED

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "status": "ACCEPTED",
    "respondedAt": "2025-11-14T..."
  },
  "message": "Match request accepted"
}
```

---

#### 3.4 Reject Match Request **[HTTP METHOD FIXED]**
```http
POST /matches/1/reject
Authorization: Bearer {{accessToken}}
```

**✅ Verify:**
- [ ] Uses `POST` method (not `PUT`)

---

### 4. Messaging ✅ **CRITICAL FIXES APPLIED**

#### 4.1 Send Message
```http
POST /messages
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "receiverId": 2,
  "content": "Hello! How are you?"
}
```

**✅ Verify:**
- [ ] Uses `receiverId` (not `toUserId`)
- [ ] Message saved to database
- [ ] Socket event emitted to receiver

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 1,
    "senderId": 1,
    "receiverId": 2,
    "content": "Hello! How are you?",
    "isRead": false,
    "createdAt": "2025-11-14T..."
  },
  "message": "Message sent successfully"
}
```

---

#### 4.2 Get Conversations List
```http
GET /messages/conversations
Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "user": {
        "id": 2,
        "profilePicture": "...",
        "profile": {
          "firstName": "Priya",
          "lastName": "Sharma"
        }
      },
      "lastMessage": {
        "id": 5,
        "content": "See you soon!",
        "senderId": 2,
        "receiverId": 1,
        "isRead": false,
        "createdAt": "2025-11-14T..."
      },
      "unreadCount": 2,
      "lastMessageAt": "2025-11-14T..."
    }
  ]
}
```

---

#### 4.3 Get Messages with User
```http
GET /messages/2?page=1&limit=50
Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "messages": [
      {
        "id": 1,
        "senderId": 1,
        "receiverId": 2,
        "content": "Hello!",
        "isRead": true,
        "createdAt": "2025-11-14T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

---

#### 4.4 Mark Messages as Read
```http
PUT /messages/2/read
Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "count": 3
  },
  "message": "Messages marked as read"
}
```

---

### 5. Socket.io Testing ✅ **EVENT NAMES FIXED**

Use a Socket.io client library or tool like **Socket.io Client Tool** Chrome extension.

#### Connection Setup
```javascript
const socket = io('http://localhost:8080', {
  auth: {
    token: 'your_access_token_here'
  }
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
});
```

---

#### Test Join Event **[NEW - ADDED]**
```javascript
// Emit join event
socket.emit('join', { userId: 1 });

// Listen for joined confirmation
socket.on('joined', (data) => {
  console.log('✅ Joined:', data);
  // Expected: { userId: 1, success: true }
});
```

---

#### Test Typing Events **[FIXED EVENT NAMES]**
```javascript
// Start typing
socket.emit('typing:start', { receiverId: 2 });

// Listen for typing started (note: 'typing:started' not 'typing:start')
socket.on('typing:started', (data) => {
  console.log('✅ User typing:', data.userId);
});

// Stop typing
socket.emit('typing:stop', { receiverId: 2 });

// Listen for typing stopped
socket.on('typing:stopped', (data) => {
  console.log('✅ User stopped typing:', data.userId);
});
```

**✅ Verify:**
- [ ] Frontend emits: `typing:start` / `typing:stop`
- [ ] Backend emits: `typing:started` / `typing:stopped`

---

#### Test Message Sending
```javascript
// Send message via socket
socket.emit('message:send', {
  receiverId: 2,
  content: 'Hello from socket!'
}, (response) => {
  console.log('✅ Message sent callback:', response);
});

// Listen for received messages
socket.on('message:received', (message) => {
  console.log('✅ New message received:', message);
});
```

**✅ Verify:**
- [ ] Uses `receiverId` (not `toUserId`)

---

## 🔍 Error Response Testing

### Test Invalid Token
```http
GET /profiles/me
Authorization: Bearer invalid_token
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid or expired token"
}
```

---

### Test Validation Error
```http
POST /matches
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "receiverId": "not_a_number"
}
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "receiverId",
      "message": "receiverId must be a number"
    }
  ]
}
```

---

### Test Missing Field
```http
POST /messages
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "content": "Hello"
}
```

**Expected Response:**
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "receiverId",
      "message": "receiverId is required"
    }
  ]
}
```

---

## ✅ Final Verification Checklist

### Authentication
- [ ] Google sign-in returns `firstName`, `lastName`, `isActive`
- [ ] Phone OTP send/verify work
- [ ] Token refresh works
- [ ] Logout works

### Profile Management
- [ ] Profile creation accepts all fields
- [ ] Get profile returns `media` with `isProfilePicture`
- [ ] Profile update works
- [ ] Search profiles with pagination works
- [ ] Photo upload returns correct format

### Match Requests **[ALL FIXES APPLIED]**
- [ ] Send match uses `receiverId` (not `toUserId`)
- [ ] Accept match uses `POST` (not `PUT`)
- [ ] Reject match uses `POST` (not `PUT`)
- [ ] Optional `message` field works
- [ ] Get received/sent matches work
- [ ] Pagination works

### Messaging **[ALL FIXES APPLIED]**
- [ ] Send message uses `receiverId` (not `toUserId`)
- [ ] Get conversations returns correct structure
- [ ] Get messages with pagination works
- [ ] Mark as read works
- [ ] Unread count works

### Socket.io **[ALL FIXES APPLIED]**
- [ ] Connection with JWT auth works
- [ ] Join event handler responds
- [ ] Typing events use correct names (`typing:started/stopped`)
- [ ] Message events use `receiverId`
- [ ] Real-time message delivery works
- [ ] User online/offline events work

### Error Handling
- [ ] 401 for invalid token
- [ ] 422 for validation errors
- [ ] 404 for not found
- [ ] Error responses follow standard format

---

## 🎯 Success Criteria

All tests pass with:
- ✅ Correct HTTP status codes
- ✅ Response format matches `{ success, statusCode, data, message }`
- ✅ Field names match frontend expectations
- ✅ Socket events use correct names
- ✅ No field name mismatches
- ✅ Pagination works correctly

---

## 📊 Test Results Summary

After running all tests, document results:

```
✅ Authentication: __/5 tests passed
✅ Profile Management: __/6 tests passed
✅ Match Requests: __/6 tests passed
✅ Messaging: __/5 tests passed
✅ Socket.io: __/5 tests passed
✅ Error Handling: __/3 tests passed

Total: __/30 tests passed
```

---

**Last Updated:** November 14, 2025  
**All Critical Fixes Applied:** ✅  
**Ready for Frontend Integration:** ✅
