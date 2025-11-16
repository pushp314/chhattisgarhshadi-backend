# Frontend API Integration Guide

## Base URL
- **Development**: `http://localhost:8080/api/v1`
- **Production**: `https://chhattisgarhshadi-backend.onrender.com/api/v1`

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 🔐 Authentication APIs

### 1. Google Sign-In (ID Token Flow) ✅ RECOMMENDED
**Endpoint**: `POST /auth/google`

**Request**:
```json
{
  "idToken": "GOOGLE_ID_TOKEN_FROM_NATIVE_SDK"
}
```

**Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "John Doe",
      "profilePhoto": "https://...",
      "role": "USER",
      "isActive": true,
      "isBanned": false
    },
    "isNewUser": true
  }
}
```

**Frontend Implementation (React Native)**:
```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_GOOGLE_CLIENT_ID',
  offlineAccess: false,
});

// Sign in function
const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    // Send idToken to backend
    const response = await fetch('http://localhost:8080/api/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: userInfo.idToken
      })
    });
    
    const data = await response.json();
    
    // Store tokens
    await AsyncStorage.setItem('accessToken', data.data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
    
    // Navigate based on isNewUser
    if (data.data.isNewUser) {
      navigation.navigate('CreateProfile');
    } else {
      navigation.navigate('Home');
    }
  } catch (error) {
    console.error(error);
  }
};
```

### 2. Refresh Token
**Endpoint**: `POST /auth/refresh`

**Request**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token"
  }
}
```

### 3. Logout
**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "refreshToken": "your_refresh_token"
}
```

### 4. Send Phone OTP
**Endpoint**: `POST /auth/phone/send-otp`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "phone": "9876543210",
  "countryCode": "+91"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "expiresAt": "2025-11-15T01:05:00.000Z"
  }
}
```

### 5. Verify Phone OTP
**Endpoint**: `POST /auth/phone/verify-otp`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "phoneVerified": true
  }
}
```

---

## 👤 Profile APIs

### 1. Create Profile (After First Login)
**Endpoint**: `POST /profiles`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1995-05-15",
  "gender": "MALE",
  "maritalStatus": "NEVER_MARRIED",
  "religion": "HINDU",
  "caste": "General",
  "height": 175,
  "weight": 70,
  "complexion": "FAIR",
  "bodyType": "AVERAGE",
  "physicalStatus": "NORMAL",
  "motherTongue": "HINDI",
  "eatingHabits": "VEGETARIAN",
  "drinkingHabits": "NO",
  "smokingHabits": "NO",
  "nativeState": "CHHATTISGARH",
  "nativeDistrict": "RAIPUR",
  "speaksChhattisgarhi": true,
  "aboutMe": "Brief description about yourself"
}
```

**Response**:
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": "profile_id",
    "userId": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "profileCompleteness": 45,
    "createdAt": "2025-11-15T00:00:00.000Z"
  }
}
```

### 2. Get My Profile
**Endpoint**: `GET /profiles/me`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "profile_id",
    "userId": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1995-05-15",
    "age": 30,
    "gender": "MALE",
    "profileCompleteness": 75,
    "isVerified": false,
    "media": [
      {
        "id": "media_id",
        "url": "https://...",
        "thumbnailUrl": "https://...",
        "type": "PROFILE_PHOTO",
        "isProfilePicture": true
      }
    ],
    "education": [],
    "occupations": []
  }
}
```

### 3. Update Profile
**Endpoint**: `PUT /profiles/me`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request** (send only fields you want to update):
```json
{
  "aboutMe": "Updated description",
  "city": "Raipur",
  "state": "CHHATTISGARH",
  "country": "INDIA"
}
```

### 4. Search Profiles
**Endpoint**: `GET /profiles/search`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Query Parameters**:
- `gender`: MALE | FEMALE | OTHER
- `minAge`: number (e.g., 25)
- `maxAge`: number (e.g., 35)
- `religions[]`: HINDU | MUSLIM | CHRISTIAN | SIKH | etc.
- `maritalStatus`: NEVER_MARRIED | DIVORCED | WIDOWED | etc.
- `minHeight`: number (in cm)
- `maxHeight`: number (in cm)
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Example URL**:
```
GET /profiles/search?gender=FEMALE&minAge=25&maxAge=30&page=1&limit=10
```

**Response**:
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "profile_id",
        "firstName": "Jane",
        "lastName": "Doe",
        "age": 28,
        "gender": "FEMALE",
        "city": "Raipur",
        "education": [...],
        "media": [...]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### 5. Get Profile by User ID
**Endpoint**: `GET /profiles/:userId`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

### 6. Delete Photo
**Endpoint**: `DELETE /profiles/photos/:mediaId`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

---

## 📤 Upload APIs

### 1. Upload Profile Photo
**Endpoint**: `POST /uploads/profile-photo`

**Headers**: 
- `Authorization: Bearer ACCESS_TOKEN`
- `Content-Type: multipart/form-data`

**Request (Form Data)**:
```
photo: File (image file - jpg, jpeg, png)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "media_id",
    "url": "https://s3.amazonaws.com/.../photo.jpg",
    "thumbnailUrl": "https://s3.amazonaws.com/.../photo_thumb.jpg",
    "type": "PROFILE_PHOTO"
  }
}
```

**Frontend Implementation (React Native)**:
```javascript
import DocumentPicker from 'react-native-document-picker';

const uploadProfilePhoto = async () => {
  try {
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.images],
    });

    const formData = new FormData();
    formData.append('photo', {
      uri: result[0].uri,
      type: result[0].type,
      name: result[0].name,
    });

    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch('http://localhost:8080/api/v1/uploads/profile-photo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();
    console.log('Upload success:', data);
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

### 2. Upload Multiple Photos
**Endpoint**: `POST /uploads/profile-photos`

**Headers**: 
- `Authorization: Bearer ACCESS_TOKEN`
- `Content-Type: multipart/form-data`

**Request (Form Data)**:
```
photos: File[] (max 5 images)
```

### 3. Upload ID Proof
**Endpoint**: `POST /uploads/id-proof`

**Headers**: 
- `Authorization: Bearer ACCESS_TOKEN`
- `Content-Type: multipart/form-data`

**Request (Form Data)**:
```
document: File (image or pdf)
documentType: string (AADHAR | PAN | PASSPORT | etc.)
```

---

## 💘 Match APIs

### 1. Get Matches
**Endpoint**: `GET /matches`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Query Parameters**:
- `page`: number
- `limit`: number

**Response**:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "id": "match_id",
        "matchScore": 85,
        "profile": {
          "id": "profile_id",
          "firstName": "Jane",
          "age": 28,
          "city": "Raipur",
          "media": [...]
        }
      }
    ],
    "pagination": {...}
  }
}
```

### 2. Send Interest
**Endpoint**: `POST /matches/interest`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "receiverId": "user_id",
  "message": "Optional message"
}
```

### 3. Respond to Interest
**Endpoint**: `PUT /matches/interest/:interestId`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "status": "ACCEPTED" // or "REJECTED"
}
```

### 4. Get Sent Interests
**Endpoint**: `GET /matches/interests/sent`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

### 5. Get Received Interests
**Endpoint**: `GET /matches/interests/received`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

---

## 💬 Message APIs

### 1. Send Message
**Endpoint**: `POST /messages`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "receiverId": "user_id",
  "content": "Hello!",
  "messageType": "TEXT" // or "IMAGE", "AUDIO", "VIDEO"
}
```

### 2. Get Conversations
**Endpoint**: `GET /messages/conversations`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Response**:
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "userId": "user_id",
        "userName": "Jane Doe",
        "userPhoto": "https://...",
        "lastMessage": "Hello!",
        "lastMessageTime": "2025-11-15T00:00:00.000Z",
        "unreadCount": 3
      }
    ]
  }
}
```

### 3. Get Messages with User
**Endpoint**: `GET /messages/:userId`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Query Parameters**:
- `page`: number
- `limit`: number

### 4. Mark as Read
**Endpoint**: `PUT /messages/:messageId/read`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

### 5. Delete Message
**Endpoint**: `DELETE /messages/:messageId`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

---

## 💰 Payment APIs

### 1. Get Subscription Plans
**Endpoint**: `GET /payments/plans`

**Response**:
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "plan_id",
        "nameEn": "Silver Plan",
        "nameHi": "सिल्वर प्लान",
        "nameCg": "सिल्वर योजना",
        "price": 999,
        "duration": 30,
        "features": {
          "unlimitedChat": true,
          "viewContacts": true,
          "profileBoost": false
        }
      }
    ]
  }
}
```

### 2. Create Payment Order
**Endpoint**: `POST /payments/create-order`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "planId": "plan_id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "amount": 999,
    "currency": "INR",
    "razorpayOrderId": "razorpay_order_id"
  }
}
```

### 3. Verify Payment
**Endpoint**: `POST /payments/verify`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Request**:
```json
{
  "orderId": "order_id",
  "razorpayPaymentId": "razorpay_payment_id",
  "razorpaySignature": "signature"
}
```

### 4. Get Active Subscription
**Endpoint**: `GET /payments/subscription`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

### 5. Get Payment History
**Endpoint**: `GET /payments/history`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

### 6. Cancel Subscription
**Endpoint**: `POST /payments/cancel-subscription`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

---

## 🔔 Notification APIs

### 1. Get Notifications
**Endpoint**: `GET /notifications`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

**Query Parameters**:
- `page`: number
- `limit`: number
- `unreadOnly`: boolean

### 2. Mark as Read
**Endpoint**: `PUT /notifications/:notificationId/read`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

### 3. Mark All as Read
**Endpoint**: `PUT /notifications/read-all`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

### 4. Get Unread Count
**Endpoint**: `GET /notifications/unread-count`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

---

## 🔌 WebSocket (Real-time)

### Connect to Socket.io
```javascript
import io from 'socket.io-client';

const token = await AsyncStorage.getItem('accessToken');

const socket = io('http://localhost:8080', {
  auth: {
    token: token
  },
  transports: ['websocket']
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to socket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket');
});

// Message received
socket.on('message:received', (message) => {
  console.log('New message:', message);
  // Update your message list
});

// User online/offline
socket.on('user:online', (data) => {
  console.log('User online:', data.userId);
});

socket.on('user:offline', (data) => {
  console.log('User offline:', data.userId);
});

// Notification received
socket.on('notification:received', (notification) => {
  console.log('New notification:', notification);
  // Show notification banner
});

// Send message
socket.emit('message:send', {
  receiverId: 'user_id',
  content: 'Hello!',
  messageType: 'TEXT'
});
```

---

## 🚨 Error Handling

All API errors follow this format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 🔐 Token Refresh Strategy

```javascript
// Axios interceptor example
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(
          'http://localhost:8080/api/v1/auth/refresh',
          { refreshToken }
        );

        const { accessToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        await AsyncStorage.clear();
        // Navigate to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 📱 Next Screens to Build

### Priority Order:

1. **Profile Creation Flow** (After first login)
   - Basic Info (name, DOB, gender, religion)
   - Location (state, district, city)
   - Physical Details (height, complexion)
   - Preferences (eating, drinking, smoking)
   - Education & Occupation
   - Photos Upload

2. **Phone Verification**
   - Send OTP screen
   - Verify OTP screen

3. **Home/Browse Screen**
   - Display matched profiles
   - Filter options
   - Profile cards with swipe

4. **Profile Detail Screen**
   - Full profile view
   - Send interest button
   - Chat button (if matched)

5. **Matches/Interests Screen**
   - Sent interests
   - Received interests
   - Accept/Reject

6. **Chat/Messages Screen**
   - Conversation list
   - Chat room with real-time messages

7. **Settings/Profile Screen**
   - View/Edit profile
   - Privacy settings
   - Subscription status

---

## 🔍 Testing Endpoints

Use Swagger UI for interactive testing:
**URL**: `http://localhost:8080/api-docs`

Or use this Postman collection structure:
1. Auth → Google Sign-In → Save tokens to environment
2. Profile → Create Profile
3. Upload → Upload Photo
4. Profile → Search Profiles
5. Match → Send Interest
6. Messages → Send Message

---

## 📞 Support

For issues or questions:
- Check logs in `logs/combined.log`
- View Swagger docs at `/api-docs`
- Health check: `GET /health`
