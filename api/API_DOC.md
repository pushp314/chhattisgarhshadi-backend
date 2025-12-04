# Chhattisgarhshadi Backend - API Testing Guide

## 📋 Overview

This document provides a complete API testing guide for QA testers. Use this with **Postman** to validate all endpoints.

**Production URL**: `https://chhattisgarhshadi-backend.onrender.com/api/v1`  
**Local URL**: `http://localhost:3000/api/v1`

---

## ⚠️ Prerequisites for Testing

Before testing, you will need:

1. **Test User Credentials** - Contact the developer for:
   - A pre-generated `accessToken` for testing (OR)
   - A test Google account to login via mobile app

2. **Admin Credentials** - For admin endpoints:
   - Admin `accessToken` (contact developer)

3. **Mobile App** - For Google OAuth login:
   - Login via the mobile app first
   - Get the tokens from the app response

> **Note**: Google OAuth requires the mobile app to generate `idToken`. API testing for login requires tokens provided by the developer.

---

## 🔧 Postman Setup

### Step 1: Create Environment Variables
In Postman, create an environment with these variables:

| Variable | Initial Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `https://chhattisgarhshadi-backend.onrender.com/api/v1` | Production API |
| `localUrl` | `http://localhost:3000/api/v1` | Local testing |
| `accessToken` | (get from developer) | User auth token |
| `refreshToken` | (empty) | Set after login |
| `userId` | (empty) | Set after login |
| `profileId` | (empty) | Set after profile creation |
| `adminAccessToken` | (get from developer) | Admin auth token |

### Step 2: Set Authorization Header
For authenticated requests, add this header:
```
Authorization: Bearer {{accessToken}}
```

### Step 3: Import Collection
1. Create a new Collection in Postman called "Chhattisgarhshadi API"
2. Add folders for each Phase (Auth, Profile, Match, etc.)
3. Copy endpoints from this document

---

## 🧪 Testing Flow (Step-by-Step)

### Phase 1: Authentication

> **⚠️ Important**: Google OAuth login requires the mobile app. For API testing, request test tokens from the developer.

#### 1.1 Google OAuth Login (Mobile App Only)
```
POST {{baseUrl}}/auth/google
Content-Type: application/json

{
  "idToken": "<Google ID Token from mobile app>",
  "agentCode": "AGT001"  // Optional - for agent referral
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": 1,
      "email": "user@gmail.com",
      "role": "USER",
      "hasProfile": false
    }
  }
}
```
**✅ Save accessToken and userId to environment**

#### 1.2 Refresh Token
```
POST {{baseUrl}}/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```

#### 1.3 Phone OTP - Send
```
POST {{baseUrl}}/auth/phone/send-otp
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "phone": "9876543210"
}
```

#### 1.4 Phone OTP - Verify
```
POST {{baseUrl}}/auth/phone/verify-otp
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

#### 1.5 Logout
```
POST {{baseUrl}}/auth/logout
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "refreshToken": "{{refreshToken}}"
}
```

---

### Phase 2: Profile Management

#### 2.1 Create Profile
```
POST {{baseUrl}}/profiles
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "gender": "MALE",
  "dateOfBirth": "1995-05-15T00:00:00.000Z",
  "maritalStatus": "NEVER_MARRIED",
  "religion": "HINDU",
  "caste": "Brahmin",
  "motherTongue": "HINDI",
  "height": 175,
  "city": "Raipur",
  "state": "Chhattisgarh",
  "country": "India",
  "nativeDistrict": "Raipur",
  "speaksChhattisgarhi": true,
  "manglik": false,
  "rashi": "ARIES",
  "nakshatra": "ASHWINI"
}
```
**✅ Save profileId from response**

#### 2.2 Get My Profile
```
GET {{baseUrl}}/profiles/me
Authorization: Bearer {{accessToken}}
```

#### 2.3 Update Profile
```
PUT {{baseUrl}}/profiles/me
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "bio": "Looking for a life partner",
  "occupation": "Software Engineer",
  "annualIncome": "10-15 LPA"
}
```

#### 2.4 Add Education
```
POST {{baseUrl}}/education
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "degree": "B.Tech",
  "field": "Computer Science",
  "institution": "NIT Raipur",
  "yearOfPassing": 2017
}
```

#### 2.5 Add Occupation
```
POST {{baseUrl}}/occupation
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "companyName": "TCS",
  "designation": "Senior Developer",
  "employmentType": "FULL_TIME",
  "industry": "IT",
  "annualIncome": "10-15 LPA",
  "isCurrent": true,
  "location": "Raipur"
}
```

#### 2.6 Set Partner Preferences
```
POST {{baseUrl}}/partner-preferences
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "ageMin": 22,
  "ageMax": 28,
  "heightMin": 155,
  "heightMax": 170,
  "maritalStatus": ["NEVER_MARRIED"],
  "religion": ["HINDU"],
  "manglik": false
}
```

---

### Phase 3: Photo Upload

#### 3.1 Upload Profile Photo
```
POST {{baseUrl}}/uploads/profile-photo
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

photo: [Select Image File]
```

#### 3.2 Upload Multiple Photos
```
POST {{baseUrl}}/uploads/profile-photos
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

photos: [Select Multiple Images - Max 6]
```

#### 3.3 Delete Photo
```
DELETE {{baseUrl}}/profiles/photos/{{mediaId}}
Authorization: Bearer {{accessToken}}
```

---

### Phase 4: Search & Discovery

#### 4.1 Search Profiles
```
GET {{baseUrl}}/profiles/search?gender=FEMALE&ageMin=22&ageMax=28&religion=HINDU&state=Chhattisgarh&page=1&limit=10
Authorization: Bearer {{accessToken}}
```

#### 4.2 Get Profile by ID
```
GET {{baseUrl}}/profiles/{{profileId}}
Authorization: Bearer {{accessToken}}
```

---

### Phase 5: Match Requests

#### 5.1 Send Match Request
```
POST {{baseUrl}}/matches/request
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "receiverId": 2,
  "message": "I found your profile interesting"
}
```

#### 5.2 Get Received Requests
```
GET {{baseUrl}}/matches/received?status=PENDING
Authorization: Bearer {{accessToken}}
```

#### 5.3 Get Sent Requests
```
GET {{baseUrl}}/matches/sent
Authorization: Bearer {{accessToken}}
```

#### 5.4 Accept Match Request
```
PUT {{baseUrl}}/matches/{{matchId}}/accept
Authorization: Bearer {{accessToken}}
```

#### 5.5 Reject Match Request
```
PUT {{baseUrl}}/matches/{{matchId}}/reject
Authorization: Bearer {{accessToken}}
```

#### 5.6 Get Accepted Matches
```
GET {{baseUrl}}/matches/accepted
Authorization: Bearer {{accessToken}}
```

---

### Phase 6: Messaging

#### 6.1 Send Message
```
POST {{baseUrl}}/messages
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "receiverId": 2,
  "content": "Hello! Nice to meet you."
}
```

#### 6.2 Get Conversations
```
GET {{baseUrl}}/messages/conversations
Authorization: Bearer {{accessToken}}
```

#### 6.3 Get Messages with User
```
GET {{baseUrl}}/messages/{{userId}}?page=1&limit=20
Authorization: Bearer {{accessToken}}
```

#### 6.4 Mark as Read
```
PUT {{baseUrl}}/messages/{{messageId}}/read
Authorization: Bearer {{accessToken}}
```

---

### Phase 7: Social Features

#### 7.1 Shortlist Profile
```
POST {{baseUrl}}/shortlist
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "profileId": 2
}
```

#### 7.2 Get Shortlisted Profiles
```
GET {{baseUrl}}/shortlist
Authorization: Bearer {{accessToken}}
```

#### 7.3 Remove from Shortlist
```
DELETE {{baseUrl}}/shortlist/{{profileId}}
Authorization: Bearer {{accessToken}}
```

#### 7.4 Block User
```
POST {{baseUrl}}/block
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "userId": 3
}
```

#### 7.5 Get Blocked Users
```
GET {{baseUrl}}/block
Authorization: Bearer {{accessToken}}
```

#### 7.6 Unblock User
```
DELETE {{baseUrl}}/block/{{userId}}
Authorization: Bearer {{accessToken}}
```

#### 7.7 Report User
```
POST {{baseUrl}}/report
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "reportedUserId": 3,
  "reason": "FAKE_PROFILE",
  "description": "This profile seems fake"
}
```

#### 7.8 Get Profile Views
```
GET {{baseUrl}}/view/received
Authorization: Bearer {{accessToken}}
```

---

### Phase 8: Contact & Photo Requests

#### 8.1 Send Contact Request
```
POST {{baseUrl}}/contact-request
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "profileId": 2,
  "requestType": "PHONE",
  "message": "Would like to connect"
}
```

#### 8.2 Respond to Contact Request
```
PUT {{baseUrl}}/contact-request/{{requestId}}
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "status": "APPROVED"
}
```

#### 8.3 Request Photo View
```
POST {{baseUrl}}/photo-request
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "photoId": 1,
  "message": "Please share your photo"
}
```

---

### Phase 9: Horoscope Matching (Guna Milan)

#### 9.1 Get Match Compatibility
```
GET {{baseUrl}}/horoscope/match/{{profileId}}
Authorization: Bearer {{accessToken}}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "canCalculate": true,
    "result": {
      "totalScore": 28,
      "maxScore": 36,
      "percentage": 78,
      "compatibilityLevel": "GOOD",
      "recommendation": "Good compatibility. A favorable match."
    },
    "kootas": {
      "varna": { "score": 1, "maxScore": 1 },
      "vashya": { "score": 2, "maxScore": 2 },
      "tara": { "score": 3, "maxScore": 3 },
      "yoni": { "score": 4, "maxScore": 4 },
      "grahaMaitri": { "score": 5, "maxScore": 5 },
      "gana": { "score": 6, "maxScore": 6 },
      "bhakoot": { "score": 7, "maxScore": 7 },
      "nadi": { "score": 0, "maxScore": 8 }
    },
    "doshas": [
      { "type": "NADI_DOSHA", "severity": "HIGH" }
    ]
  }
}
```

#### 9.2 Calculate Between Two Profiles
```
POST {{baseUrl}}/horoscope/calculate
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "profileId1": 1,
  "profileId2": 2
}
```

---

### Phase 10: Subscription & Payments

#### 10.1 Get Subscription Plans
```
GET {{baseUrl}}/plans
Authorization: Bearer {{accessToken}}
```

#### 10.2 Create Payment Order
```
POST {{baseUrl}}/payments/create-order
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "planId": 1
}
```

#### 10.3 Verify Payment
```
POST {{baseUrl}}/payments/verify
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

#### 10.4 Get Payment History
```
GET {{baseUrl}}/payments/history
Authorization: Bearer {{accessToken}}
```

---

### Phase 11: Privacy Settings

#### 11.1 Get Privacy Settings
```
GET {{baseUrl}}/privacy
Authorization: Bearer {{accessToken}}
```

#### 11.2 Update Privacy Settings
```
PUT {{baseUrl}}/privacy
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "profileVisibility": "REGISTERED",
  "showPhone": "MATCHED",
  "showEmail": "HIDDEN",
  "allowMessagesFrom": "MATCHED_ONLY"
}
```

---

### Phase 12: Notifications

#### 12.1 Get Notifications
```
GET {{baseUrl}}/notifications?page=1&limit=20
Authorization: Bearer {{accessToken}}
```

#### 12.2 Mark Notification as Read
```
PUT {{baseUrl}}/notifications/{{notificationId}}/read
Authorization: Bearer {{accessToken}}
```

#### 12.3 Update Notification Preferences
```
PUT {{baseUrl}}/settings/notifications
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "pushEnabled": true,
  "emailEnabled": true,
  "matchRequests": true,
  "messages": true,
  "profileViews": false
}
```

#### 12.4 Register FCM Token (For Push Notifications)
```
POST {{baseUrl}}/users/fcm-token
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "token": "fcm_device_token_from_firebase",
  "deviceId": "unique_device_identifier",
  "deviceType": "ANDROID",
  "deviceName": "Samsung Galaxy S21"
}
```

**deviceType options**: `ANDROID`, `IOS`, `WEB`

**Expected Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "token": "fcm...",
    "deviceType": "ANDROID",
    "isActive": true
  },
  "message": "FCM token registered successfully"
}
```

---

## 👑 Admin Endpoints

### Admin Authentication
Admin must have role `ADMIN` or `SUPER_ADMIN`.

#### A1. Get Dashboard Stats
```
GET {{baseUrl}}/admin/stats
Authorization: Bearer {{adminAccessToken}}
```

#### A2. Get All Users
```
GET {{baseUrl}}/admin/users?page=1&limit=20
Authorization: Bearer {{adminAccessToken}}
```

#### A3. Get All Profiles
```
GET {{baseUrl}}/admin/profiles?page=1&limit=20
Authorization: Bearer {{adminAccessToken}}
```

#### A4. Update User Role
```
PUT {{baseUrl}}/admin/users/{{userId}}/role
Authorization: Bearer {{adminAccessToken}}
Content-Type: application/json

{
  "role": "PREMIUM_USER"
}
```

#### A5. Delete User
```
DELETE {{baseUrl}}/admin/users/{{userId}}
Authorization: Bearer {{adminAccessToken}}
```

---

### Agent Management (Admin)

#### A6. Create Agent
```
POST {{baseUrl}}/admin/agents
Authorization: Bearer {{adminAccessToken}}
Content-Type: application/json

{
  "agentCode": "AGT001",
  "agentName": "Ravi Agent",
  "phone": "9876543210",
  "email": "agent@example.com",
  "city": "Raipur",
  "district": "Raipur",
  "state": "Chhattisgarh"
}
```

#### A7. Get All Agents
```
GET {{baseUrl}}/admin/agents?page=1&limit=10
Authorization: Bearer {{adminAccessToken}}
```

#### A8. Get Users by Agent (For Commission)
```
GET {{baseUrl}}/admin/agents/{{agentId}}/users?page=1&limit=20
Authorization: Bearer {{adminAccessToken}}
```

**Response includes:**
- List of users registered with this agent's code
- User details (name, email, role, registration date)

#### A9. Get Agent Stats (For Commission Calculation)
```
GET {{baseUrl}}/admin/agents/{{agentId}}/stats
Authorization: Bearer {{adminAccessToken}}
```

**Response:**
```json
{
  "stats": {
    "totalUsersRegistered": 25,
    "premiumUsers": 5,
    "activeUsers": 23,
    "freeUsers": 20
  }
}
```

---

### Verification Management (Admin)

#### A10. Get Pending Verifications
```
GET {{baseUrl}}/admin/verifications/pending?page=1&limit=10
Authorization: Bearer {{adminAccessToken}}
```

#### A11. Approve Document
```
POST {{baseUrl}}/admin/verifications/{{mediaId}}/approve
Authorization: Bearer {{adminAccessToken}}
```

#### A12. Reject Document
```
POST {{baseUrl}}/admin/verifications/{{mediaId}}/reject
Authorization: Bearer {{adminAccessToken}}
Content-Type: application/json

{
  "reason": "Document is not clear. Please upload a better quality image."
}
```

---

### Report Management (Admin)

#### A13. Get All Reports
```
GET {{baseUrl}}/admin/reports?status=PENDING
Authorization: Bearer {{adminAccessToken}}
```

#### A14. Update Report Status
```
PUT {{baseUrl}}/admin/reports/{{reportId}}
Authorization: Bearer {{adminAccessToken}}
Content-Type: application/json

{
  "status": "RESOLVED",
  "reviewNote": "User banned for fake profile"
}
```

---

## 📊 Feature Comparison: Chhattisgarhshadi vs Jeevansathi

| Feature | Jeevansathi | Chhattisgarhshadi | Status |
|---------|-------------|-------------------|--------|
| **Authentication** ||||
| Email/Password Login | ✅ | ❌ | Not needed (Google OAuth) |
| Google OAuth | ✅ | ✅ | **COMPLETE** |
| Phone OTP Verification | ✅ | ✅ | **COMPLETE** |
| **Profile** ||||
| Basic Profile | ✅ | ✅ | **COMPLETE** |
| Education Details | ✅ | ✅ | **COMPLETE** |
| Occupation Details | ✅ | ✅ | **COMPLETE** |
| Family Details | ✅ | ✅ | **COMPLETE** |
| Photo Upload (Multiple) | ✅ | ✅ | **COMPLETE** |
| Partner Preferences | ✅ | ✅ | **COMPLETE** |
| Profile Completeness % | ✅ | ✅ | **COMPLETE** |
| Regional Fields (CG specific) | ❌ | ✅ | **ADDED** |
| **Matching** ||||
| Send Interest/Request | ✅ | ✅ | **COMPLETE** |
| Accept/Reject | ✅ | ✅ | **COMPLETE** |
| View Matches | ✅ | ✅ | **COMPLETE** |
| **Search & Discovery** ||||
| Basic Search | ✅ | ✅ | **COMPLETE** |
| Filter by Religion/Caste | ✅ | ✅ | **COMPLETE** |
| Filter by Location | ✅ | ✅ | **COMPLETE** |
| Smart Recommendations | ✅ | 🔶 | Planned |
| **Messaging** ||||
| Chat Messages | ✅ | ✅ | **COMPLETE** |
| Real-time (Socket.IO) | ✅ | ✅ | **COMPLETE** |
| Read Receipts | ✅ | ✅ | **COMPLETE** |
| Attachments | ✅ | ✅ | **COMPLETE** |
| **Horoscope** ||||
| Kundli/Birth Chart | ✅ | 🔶 | Fields exist |
| Guna Milan (36 Points) | ✅ | ✅ | **COMPLETE** |
| Manglik Matching | ✅ | ✅ | **COMPLETE** |
| Nadi Dosha Detection | ✅ | ✅ | **COMPLETE** |
| **Privacy** ||||
| Profile Visibility | ✅ | ✅ | **COMPLETE** |
| Photo Privacy | ✅ | ✅ | **COMPLETE** |
| Contact Privacy | ✅ | ✅ | **COMPLETE** |
| Block Users | ✅ | ✅ | **COMPLETE** |
| Hide Profile | ✅ | ✅ | **COMPLETE** |
| **Social** ||||
| Shortlist/Bookmark | ✅ | ✅ | **COMPLETE** |
| Profile Views | ✅ | ✅ | **COMPLETE** |
| Report Users | ✅ | ✅ | **COMPLETE** |
| **Payments** ||||
| Subscription Plans | ✅ | ✅ | **COMPLETE** |
| Razorpay Integration | N/A | ✅ | **COMPLETE** |
| Payment History | ✅ | ✅ | **COMPLETE** |
| **Notifications** ||||
| Push Notifications (FCM) | ✅ | ✅ | **COMPLETE** |
| Email Notifications | ✅ | ✅ | **COMPLETE** |
| SMS Notifications | ✅ | ✅ | **COMPLETE** |
| **Admin Panel** ||||
| User Management | ✅ | ✅ | **COMPLETE** |
| Report Management | ✅ | ✅ | **COMPLETE** |
| Agent Management | ❌ | ✅ | **ADDED** |
| Commission Tracking | ❌ | ✅ | **ADDED** |
| Verification Queue | ✅ | ✅ | **COMPLETE** |
| **Unique to CG Shadi** ||||
| Agent Referral System | ❌ | ✅ | **UNIQUE** |
| Native District Field | ❌ | ✅ | **UNIQUE** |
| Speaks Chhattisgarhi | ❌ | ✅ | **UNIQUE** |

### Summary
- **Total Features**: 45+
- **Completed**: 40+ (90%)
- **Unique CG Features**: 3

---

## ✅ Test Checklist

| # | Test Case | Endpoint | Expected | Pass/Fail |
|---|-----------|----------|----------|-----------|
| 1 | Login with Google | POST /auth/google | 200, tokens | ⬜ |
| 2 | Create profile | POST /profiles | 201, profile | ⬜ |
| 3 | Upload photo | POST /uploads/profile-photo | 200, mediaId | ⬜ |
| 4 | Search profiles | GET /profiles/search | 200, results | ⬜ |
| 5 | Send match request | POST /matches/request | 201, request | ⬜ |
| 6 | Accept match | PUT /matches/:id/accept | 200, updated | ⬜ |
| 7 | Send message | POST /messages | 201, message | ⬜ |
| 8 | Get conversations | GET /messages/conversations | 200, list | ⬜ |
| 9 | Horoscope match | GET /horoscope/match/:id | 200, score | ⬜ |
| 10 | Create payment | POST /payments/create-order | 200, order | ⬜ |
| 11 | Block user | POST /block | 201, blocked | ⬜ |
| 12 | Report user | POST /report | 201, report | ⬜ |
| 13 | Update privacy | PUT /privacy | 200, settings | ⬜ |
| 14 | Admin - get stats | GET /admin/stats | 200, stats | ⬜ |
| 15 | Admin - agent users | GET /admin/agents/:id/users | 200, users | ⬜ |

---

## 🚨 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Rate Limited |
| 500 | Server Error |

---

## 📦 What Developer Must Provide to Tester

Before sending this document, the developer must provide:

### 1. Test Tokens
```
User Access Token: eyJhbGc...
Admin Access Token: eyJhbGc...
```

### 2. Test User IDs
```
Test User 1 ID: ___
Test User 2 ID: ___ (for matching/messaging tests)
Test Profile 1 ID: ___
Test Profile 2 ID: ___
```

### 3. Test Agent (if testing agent features)
```
Test Agent Code: AGT001
Test Agent ID: ___
```

### 4. Environment Details
```
Production URL: https://chhattisgarhshadi-backend.onrender.com/api/v1
Is Production Deployed: Yes/No (confirm)
Database has test data: Yes/No
```

> **Tip**: Create 2 test users before testing so the tester can test matching, messaging, and social features between them.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**API Version**: v1  
**Production URL**: https://chhattisgarhshadi-backend.onrender.com/api/v1

