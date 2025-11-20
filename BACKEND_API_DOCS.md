# Backend API Documentation

This document provides a complete API reference for the chhattisgarh-shaadi project.

---

## AUTH

### 1. Google Mobile Auth

- **Endpoint**: `POST /api/v1/auth/google`
- **Auth Required**: No
- **Middleware**: `validate`, `authLimiter`

**Request Body**

```json
{
  "idToken": "string",
  "deviceInfo": "object",
  "agentCode": "string"
}
```

**Validation**

- `idToken`: Required, string, min 1 char.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "user": {
      "id": "string",
      "email": "string",
      "role": "string",
      "isNewUser": "boolean"
    }
  }
}
```

- **400 Bad Request**

```json
{
  "success": false,
  "message": "Either authorizationCode or idToken is required",
  "errors": []
}
```

**React Native (Axios) Example**

```ts
const res = await api.post('/auth/google', {
  idToken
});
console.log(res.data);
```

### 2. Refresh Token

- **Endpoint**: `POST /api/v1/auth/refresh`
- **Auth Required**: No
- **Middleware**: `validate`

**Request Body**

```json
{
  "refreshToken": "string"
}
```

**Validation**

- `refreshToken`: Required, string, min 1 char.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Tokens refreshed successfully.",
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

- **401 Unauthorized**

```json
{
  "success": false,
  "message": "Invalid refresh token.",
  "errors": []
}
```

**React Native (Axios) Example**

```ts
const res = await api.post('/auth/refresh', {
  refreshToken
});
console.log(res.data);
```

### 3. Logout

- **Endpoint**: `POST /api/v1/auth/logout`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Request Body**

```json
{
  "refreshToken": "string"
}
```

**Validation**

- `refreshToken`: Optional, string, min 1 char.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": {}
}
```

- **401 Unauthorized**

```json
{
  "success": false,
  "message": "Unauthorized.",
  "errors": []
}
```

**React Native (Axios) Example**

```ts
const res = await api.post('/auth/logout', {
  refreshToken
});
console.log(res.data);
```

### 4. Send Phone OTP

- **Endpoint**: `POST /api/v1/auth/phone/send-otp`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `otpLimiter`, `validate`

**Request Body**

```json
{
  "phone": "string",
  "countryCode": "string"
}
```

**Validation**

- `phone`: Required, string, regex `/^[6-9]\d{9}$/`.
- `countryCode`: Optional, string, starts with `+`.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "OTP sent successfully.",
  "data": {}
}
```

- **400 Bad Request**

```json
{
  "success": false,
  "message": "Invalid phone number format.",
  "errors": []
}
```

**React Native (Axios) Example**

```ts
const res = await api.post('/auth/phone/send-otp', {
  phone,
  countryCode
});
console.log(res.data);
```

### 5. Verify Phone OTP

- **Endpoint**: `POST /api/v1/auth/phone/verify-otp`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Request Body**

```json
{
  "phone": "string",
  "otp": "string"
}
```

**Validation**

- `phone`: Required, string, regex `/^[6-9]\d{9}$/`.
- `otp`: Required, string, length 6.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Phone number verified successfully.",
  "data": {}
}
```

- **400 Bad Request**

```json
{
  "success": false,
  "message": "Invalid OTP.",
  "errors": []
}
```

**React Native (Axios) Example**

```ts
const res = await api.post('/auth/phone/verify-otp', {
  phone,
  otp
});
console.log(res.data);
```

---

## USER

### 1. Get My Profile

- **Endpoint**: `GET /api/v1/users/me`
- **Auth Required**: Yes
- **Middleware**: `authenticate`

**Request Body**: None

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "User profile retrieved successfully.",
  "data": {
    "id": "number",
    "email": "string",
    "role": "string",
    "profilePicture": "string",
    "preferredLanguage": "string",
    "profile": {
      "id": "number",
      "firstName": "string",
      "lastName": "string",
      // ... other profile fields
    }
  }
}
```

**React Native (Axios) Example**

```ts
const res = await api.get('/users/me');
console.log(res.data);
```

### 2. Update My Profile

- **Endpoint**: `PUT /api/v1/users/me`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Request Body**

```json
{
  "profilePicture": "string",
  "preferredLanguage": "string"
}
```

**Validation**

- `profilePicture`: Optional, string, URL format.
- `preferredLanguage`: Optional, string, enum from `LANGUAGE`.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "User profile updated successfully.",
  "data": {
    // updated user object
  }
}
```

**React Native (Axios) Example**

```ts
const res = await api.put('/users/me', {
  profilePicture: 'https://example.com/new-pic.jpg'
});
console.log(res.data);
```

### 3. Get User by ID

- **Endpoint**: `GET /api/v1/users/:id`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Path Params**

- `id`: number (user ID)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "User profile retrieved successfully.",
  "data": {
    // user object
  }
}
```

- **404 Not Found**

```json
{
  "success": false,
  "message": "User not found.",
  "errors": []
}
```

**React Native (Axios) Example**

```ts
const userId = 123;
const res = await api.get(`/users/${userId}`);
console.log(res.data);
```

---

## PROFILE

### 1. Create My Profile

- **Endpoint**: `POST /api/v1/profile`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`
- **Business Logic**: This is typically called once after a new user signs up to create their initial matrimony profile.

**Request Body**

A JSON object with the user's profile information.

*Required Fields*:
`firstName`, `lastName`, `dateOfBirth`, `gender`, `maritalStatus`, `religion`, `motherTongue`, `country`, `state`, `city`

*Optional Fields*:
All other fields from the profile model are optional on creation. See `profile.validation.js` for a complete list of over 40 fields, including `bio`, `height`, `caste`, `occupation`, `annualIncome`, etc.

```json
{
  "firstName": "Suresh",
  "lastName": "Verma",
  "dateOfBirth": "1995-08-15T00:00:00.000Z",
  "gender": "MALE",
  "maritalStatus": "NEVER_MARRIED",
  "religion": "HINDU",
  "motherTongue": "HINDI",
  "country": "India",
  "state": "Chhattisgarh",
  "city": "Raipur",
  "bio": "Software developer looking for a life partner.",
  "height": 175,
  "caste": "Kurmi"
}
```

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Profile created successfully.",
  "data": {
    // The full profile object
  }
}
```

**Common Errors**
- `400 Bad Request`: If required fields are missing or validation fails (e.g., invalid date format).
- `401 Unauthorized`: If the user is not authenticated.
- `409 Conflict`: If a profile for this user already exists.

**React Native (Axios) Example**

```ts
const profileData = {
  firstName: "Suresh",
  lastName: "Verma",
  dateOfBirth: "1995-08-15T00:00:00.000Z",
  gender: "MALE",
  maritalStatus: "NEVER_MARRIED",
  religion: "HINDU",
  motherTongue: "HINDI",
  country: "India",
  state: "Chhattisgarh",
  city: "Raipur"
};

const res = await api.post('/profile', profileData);
console.log(res.data);
```

### 2. Get My Profile

- **Endpoint**: `GET /api/v1/profile/me`
- **Auth Required**: Yes
- **Middleware**: `authenticate`

**Request**: No body, query, or path params.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "id": 1,
    "userId": 12,
    "firstName": "Suresh",
    "lastName": "Verma",
    // ... all other profile fields
    "completeness": 85
  }
}
```

**Common Errors**
- `401 Unauthorized`.
- `404 Not Found`: If no profile exists for the logged-in user.

**React Native (Axios) Example**

```ts
const res = await api.get('/profile/me');
console.log(res.data.data.firstName); // "Suresh"
```

### 3. Update My Profile

- **Endpoint**: `PUT /api/v1/profile/me`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Request Body**

A JSON object with the fields to update. All fields are optional.

```json
{
  "bio": "Updated bio: I enjoy hiking and photography.",
  "annualIncome": "10-15LPA",
  "drinkingHabit": "NO"
}
```

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    // The updated profile object
  }
}
```

**Common Errors**
- `400 Bad Request`: For validation errors (e.g., `height` is not a number).
- `401 Unauthorized`.
- `404 Not Found`: If no profile exists to update.

**React Native (Axios) Example**

```ts
const updates = {
  bio: "Updated bio: I enjoy hiking and photography.",
  annualIncome: "10-15LPA",
};

const res = await api.put('/profile/me', updates);
console.log(res.data);
```

### 4. Search Profiles

- **Endpoint**: `GET /api/v1/profile/search`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`
- **Business Logic**: Users can only search for other profiles if their own profile is sufficiently complete.

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 20)
- `gender`: `string` (optional, e.g., 'MALE', 'FEMALE')
- `minAge`: `number` (optional)
- `maxAge`: `number` (optional)
- `religions`: `string` (optional, comma-separated, e.g., `HINDU,SIKH`)
- `castes`: `string` (optional, comma-separated)
- `maritalStatus`: `string` (optional, e.g., `NEVER_MARRIED`)
- `minHeight`: `number` (optional, in cm)
- `maxHeight`: `number` (optional, in cm)
- `nativeDistrict`: `string` (optional)
- `speaksChhattisgarhi`: `boolean` (optional)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Profiles retrieved successfully.",
  "data": {
    "results": [
      // array of profile objects
    ],
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalResults": 95
  }
}
```

**Common Errors**
- `401 Unauthorized`.
- `403 Forbidden`: If the user's own profile is not complete (`requireCompleteProfile` middleware).

**React Native (Axios) Example**

```ts
const searchParams = {
  gender: 'FEMALE',
  minAge: 25,
  maxAge: 30,
  religions: 'HINDU',
  page: 1
};

const res = await api.get('/profile/search', { params: searchParams });
console.log(res.data.data.results);
```

### 5. Get Profile by User ID

- **Endpoint**: `GET /api/v1/profile/:userId`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**

- `userId`: `number` (The ID of the user whose profile you want to view)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    // The requested user's profile object
  }
}
```

**Common Errors**
- `401 Unauthorized`.
- `403 Forbidden`: If the user's own profile is not complete.
- `404 Not Found`: If no profile exists for the given `userId`.

**React Native (Axios) Example**

```ts
const targetUserId = 45;
const res = await api.get(`/profile/${targetUserId}`);
console.log(res.data);
```

### 6. Delete My Photo

- **Endpoint**: `DELETE /api/v1/profile/photos/:mediaId`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Path Params**

- `mediaId`: `number` (The ID of the photo/media to delete)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Photo deleted successfully.",
  "data": {}
}
```

**Common Errors**
- `401 Unauthorized`.
- `403 Forbidden`: If the user tries to delete a photo that isn't theirs.
- `404 Not Found`: If the media with the given ID doesn't exist.

**React Native (Axios) Example**

```ts
const photoIdToDelete = 123;
const res = await api.delete(`/profile/photos/${photoIdToDelete}`);
console.log(res.data.message); // "Photo deleted successfully."
```

---

## EDUCATION

This section covers the management of a user's educational qualifications. Users can add, view, update, and delete their education records.

### 1. Add an Education Record

- **Endpoint**: `POST /api/v1/education`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Request Body**

```json
{
  "degree": "string",
  "institution": "string",
  "field": "string",
  "university": "string",
  "yearOfPassing": "number",
  "grade": "string",
  "isCurrent": "boolean"
}
```

**Validation**

- `degree`: Required, string, min 2 chars.
- `institution`: Required, string, min 2 chars.

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Education created successfully.",
  "data": {
    // The new education object
  }
}
```

**React Native (Axios) Example**

```ts
const educationData = {
  degree: "Bachelor of Engineering",
  institution: "BIT Durg",
  field: "Computer Science",
  yearOfPassing: 2020
};

const res = await api.post('/education', educationData);
console.log(res.data);
```

### 2. Get My Education Records

- **Endpoint**: `GET /api/v1/education`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Education retrieved successfully.",
  "data": [
    // Array of education objects
  ]
}
```

**React Native (Axios) Example**

```ts
const res = await api.get('/education');
console.log(res.data.data);
```

### 3. Update an Education Record

- **Endpoint**: `PUT /api/v1/education/:id`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**
- `id`: number (The ID of the education record to update)

**Request Body**

Any of the fields from the education model.

```json
{
  "grade": "8.5 CGPA"
}
```

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Education updated successfully.",
  "data": {
    // The updated education object
  }
}
```

**React Native (Axios) Example**

```ts
const educationId = 1;
const updates = { grade: "8.5 CGPA" };
const res = await api.put(`/education/${educationId}`, updates);
console.log(res.data);
```

### 4. Delete an Education Record

- **Endpoint**: `DELETE /api/v1/education/:id`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**
- `id`: number (The ID of the education record to delete)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Education deleted successfully.",
  "data": {}
}
```

**React Native (Axios) Example**

```ts
const educationId = 1;
const res = await api.delete(`/education/${educationId}`);
console.log(res.data.message);
```

---

## OCCUPATION

This section deals with a user's professional history. It allows for creating, retrieving, updating, and deleting occupation entries.

### 1. Add an Occupation Record

- **Endpoint**: `POST /api/v1/occupation`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Request Body**

```json
{
  "companyName": "string",
  "designation": "string",
  "employmentType": "string",
  "industry": "string",
  "annualIncome": "string",
  "startDate": "string",
  "endDate": "string",
  "isCurrent": "boolean",
  "location": "string",
  "description": "string"
}
```

**Validation**

- `companyName`: Required, string, min 2 chars.
- `designation`: Required, string, min 2 chars.
- `employmentType`: Required, string.

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Occupation created successfully.",
  "data": {
    // The new occupation object
  }
}
```

**React Native (Axios) Example**

```ts
const occupationData = {
  companyName: "Tech Solutions Inc.",
  designation: "Software Engineer",
  employmentType: "Full-time",
  isCurrent: true
};

const res = await api.post('/occupation', occupationData);
console.log(res.data);
```

### 2. Get My Occupation Records

- **Endpoint**: `GET /api/v1/occupation`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Occupations retrieved successfully.",
  "data": [
    // Array of occupation objects
  ]
}
```

**React Native (Axios) Example**

```ts
const res = await api.get('/occupation');
console.log(res.data.data);
```

### 3. Update an Occupation Record

- **Endpoint**: `PUT /api/v1/occupation/:id`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**
- `id`: number (The ID of the occupation record to update)

**Request Body**

Any of the fields from the occupation model.

```json
{
  "annualIncome": "15-20LPA"
}
```

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Occupation updated successfully.",
  "data": {
    // The updated occupation object
  }
}
```

**React Native (Axios) Example**

```ts
const occupationId = 1;
const updates = { annualIncome: "15-20LPA" };
const res = await api.put(`/occupation/${occupationId}`, updates);
console.log(res.data);
```

### 4. Delete an Occupation Record

- **Endpoint**: `DELETE /api/v1/occupation/:id`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**
- `id`: number (The ID of the occupation record to delete)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Occupation deleted successfully.",
  "data": {}
}
```

**React Native (Axios) Example**

```ts
const occupationId = 1;
const res = await api.delete(`/occupation/${occupationId}`);
console.log(res.data.message);
```

---

## PARTNER PREFERENCE

This section allows users to define, update, and retrieve their partner preferences.

### 1. Get My Partner Preferences
- **Endpoint**: `GET /api/v1/partner-preference`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`

**Response**
- **200 OK**
```json
{
  "success": true,
  "message": "Partner preference retrieved successfully.",
  "data": {
    // The user's partner preference object
  }
}
```

### 2. Create or Update My Partner Preferences
- **Endpoint**: `PUT /api/v1/partner-preference`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Request Body**
```json
{
    "ageFrom": 25,
    "ageTo": 30,
    "heightFrom": 160,
    "heightTo": 180,
    "religion": ["HINDU"],
    "caste": ["Kurmi", "Sahu"],
    "motherTongue": "Hindi",
    "maritalStatus": ["NEVER_MARRIED"],
    "country": "India",
    "state": ["Chhattisgarh", "Maharashtra"],
    "city": ["Raipur", "Pune"],
    "residencyStatus": "CITIZEN",
    "nativeDistrict": ["Durg", "Raipur"],
    "mustSpeakChhattisgarhi": true,
    "education": ["Bachelors", "Masters"],
    "occupation": ["Software Developer", "Doctor"],
    "annualIncome": "10-15LPA",
    "diet": "VEG",
    "smoking": "NO",
    "drinking": "NO",
    "manglik": false,
    "description": "Looking for a kind and caring partner."
}
```
**Response**

- **200 OK**
```json
{
  "success": true,
  "message": "Partner preference updated successfully.",
  "data": {
    // The updated partner preference object
  }
}
```

---

## SUBSCRIPTION

This section allows users to get the available subscription plans.

### 1. Get Subscription Plans
- **Endpoint**: `GET /api/v1/subscription`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, ault: 10)

**Response**

- **200 OK**
```json
{
  "success": true,
  "message": "Plans retrieved successfully.",
  "data": {
    "results": [
      // array of plan objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 3
  }
}
```

---

## ADMIN

This section covers all administrator-level operations. All endpoints require `ADMIN` role.

### 1. Get All Users

- **Endpoint**: `GET /api/v1/admin/users`
- **Query Parameters**: `page`, `limit`

### 2. Get Recent Users

- **Endpoint**: `GET /api/v1/admin/users/recent`
- **Query Parameters**: `limit`

### 3. Get User by ID

- **Endpoint**: `GET /api/v1/admin/users/:userId`

### 4. Update User Role

- **Endpoint**: `PUT /api/v1/admin/users/:userId/role`
- **Request Body**:
```json
{
  "role": "USER"
}
```

### 5. Delete User

- **Endpoint**: `DELETE /api/v1/admin/users/:userId`

### 6. Get All Profiles

- **Endpoint**: `GET /api/v1/admin/profiles`
- **Query Parameters**: `page`, `limit`

### 7. Get Recent Matches

- **Endpoint**: `GET /api/v1/admin/matches/recent`
- **Query Parameters**: `limit`

### 8. Get Dashboard Stats

- **Endpoint**: `GET /api/v1/admin/stats`

### 9. Cleanup Expired Tokens

- **Endpoint**: `POST /api/v1/admin/cleanup/tokens`

### 10. Get Reports

- **Endpoint**: `GET /api/v1/admin/reports`
- **Query Parameters**: `page`, `limit`, `status`

### 11. Get Report by ID

- **Endpoint**: `GET /api/v1/admin/reports/:id`

### 12. Update Report

- **Endpoint**: `PUT /api/v1/admin/reports/:id`
- **Request Body**:
```json
{
  "status": "REVIEWED",
  "reviewNote": "This is a note",
  "actionTaken": "This is the action taken"
}
```

### 13. Create Agent

- **Endpoint**: `POST /api/v1/admin/agents`
- **Request Body**: See `agent.validation.js` for all possible fields.

### 14. Get All Agents

- **Endpoint**: `GET /api/v1/admin/agents`
- **Query Parameters**: `page`, `limit`, `status`, `district`, `search`

### 15. Get Agent by ID

- **Endpoint**: `GET /api/v1/admin/agents/:agentId`

### 16. Update Agent

- **Endpoint**: `PUT /api/v1/admin/agents/:agentId`
- **Request Body**: See `agent.validation.js` for all possible fields.

### 17. Delete Agent

- **Endpoint**: `DELETE /api/v1/admin/agents/:agentId`

---

## BLOCK

This section covers blocking and unblocking users.

### 1. Block a User

- **Endpoint**: `POST /api/v1/block`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Request Body**

```json
{
  "blockedId": "number",
  "reason": "string"
}
```

**Validation**

- `blockedId`: Required, number.
- `reason`: Optional, string, max 100 chars.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "User blocked successfully.",
  "data": {}
}
```

### 2. Get My Blocked List

- **Endpoint**: `GET /api/v1/block`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 10)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Blocked list retrieved successfully.",
  "data": {
    "results": [
      // array of blocked user objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### 3. Unblock a User

- **Endpoint**: `DELETE /api/v1/block/:blockedId`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**

- `blockedId`: number (The ID of the user to unblock)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "User unblocked successfully.",
  "data": {}
}
```
---

## CONTACT REQUEST

This section deals with managing contact requests between users. Users can send requests to see contact information (like phone or email), view sent and received requests, and respond to them.

### 1. Create a Contact Request

- **Endpoint**: `POST /api/v1/contact-requests`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `requireSubscription`, `validate`
- **Business Logic**: The requesting user must have an active subscription to send a contact request.

**Request Body**

```json
{
  "profileId": 123,
  "requestType": "PHONE",
  "message": "I would like to connect with you."
}
```

**Validation**

- `profileId`: Required, number (The ID of the profile you want to contact).
- `requestType`: Required, string, enum (`PHONE`, `EMAIL`).
- `message`: Optional, string, max 500 chars.

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Contact request sent successfully.",
  "data": {
    // The new contact request object
  }
}
```

**Common Errors**
- `401 Unauthorized`: If the user is not authenticated.
- `403 Forbidden`: If the user does not have a complete profile or an active subscription.
- `404 Not Found`: If the target `profileId` does not exist.

### 2. Get Sent Contact Requests

- **Endpoint**: `GET /api/v1/contact-requests/sent`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 10)
- `status`: `string` (optional, enum from `CONTACT_REQUEST_STATUS`, e.g., `PENDING`, `APPROVED`, `REJECTED`)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Sent contact requests retrieved successfully.",
  "data": {
    "results": [
      // array of contact request objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 5
  }
}
```

### 3. Get Received Contact Requests

- **Endpoint**: `GET /api/v1/contact-requests/received`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 10)
- `status`: `string` (optional, enum from `CONTACT_REQUEST_STATUS`)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Received contact requests retrieved successfully.",
  "data": {
    "results": [
      // array of contact request objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "totalResults": 12
  }
}
```

### 4. Respond to a Contact Request

- **Endpoint**: `POST /api/v1/contact-requests/:id/respond`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**

- `id`: `number` (The ID of the contact request to respond to)

**Request Body**

```json
{
  "status": "APPROVED"
}
```

**Validation**

- `status`: Required, string, enum (`APPROVED`, `REJECTED`).

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Successfully responded to contact request.",
  "data": {
      // The updated contact request object
  }
}
```

**Common Errors**
- `401 Unauthorized`.
- `403 Forbidden`: If the user tries to respond to a request that wasn't sent to them.
- `404 Not Found`: If the contact request with the given `id` doesn't exist.


---

## MATCHES

This section covers the entire lifecycle of a match between two users, from sending a request to accepting, rejecting, or deleting it.

### 1. Send a Match Request

- **Endpoint**: `POST /api/v1/matches`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Request Body**

```json
{
  "profileId": 456
}
```

**Validation**

- `profileId`: Required, number (The ID of the profile to send a match request to).

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Match request sent successfully.",
  "data": {
    // The new match object
  }
}
```

### 2. Get Sent Match Requests

- **Endpoint**: `GET /api/v1/matches/sent`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Query Parameters**

- `page`: `number` (optional, default: 1)
- `limit`: `number` (optional, default: 10)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Sent match requests retrieved successfully.",
  "data": {
    "results": [
      // array of sent match objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 8
  }
}
```

### 3. Get Received Match Requests

- **Endpoint**: `GET /api/v1/matches/received`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Query Parameters**

- `page`: `number` (optional, default: 1)
- `limit`: `number` (optional, default: 10)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Received match requests retrieved successfully.",
  "data": {
    "results": [
      // array of received match objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "totalResults": 15
  }
}
```

### 4. Get Accepted Matches

- **Endpoint**: `GET /api/v1/matches/accepted`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Query Parameters**

- `page`: `number` (optional, default: 1)
- `limit`: `number` (optional, default: 10)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Accepted matches retrieved successfully.",
  "data": {
    "results": [
      // array of accepted match objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 3
  }
}
```

### 5. Accept a Match Request

- **Endpoint**: `POST /api/v1/matches/:matchId/accept`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**

- `matchId`: `number` (The ID of the match request to accept).

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Match request accepted.",
  "data": {
      // The updated match object
  }
}
```

### 6. Reject a Match Request

- **Endpoint**: `POST /api/v1/matches/:matchId/reject`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**

- `matchId`: `number` (The ID of the match request to reject).

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Match request rejected.",
  "data": {
      // The updated match object
  }
}
```

### 7. Delete a Match

- **Endpoint**: `DELETE /api/v1/matches/:matchId`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**

- `matchId`: `number` (The ID of the match to delete. This can be done by either user in the match). 

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Match deleted successfully.",
  "data": {}
}
```


---

## MESSAGES

This section outlines the real-time chat functionality between two matched users.

### 1. Send a Message

- **Endpoint**: `POST /api/v1/messages`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`
- **Business Logic**: A user can only send a message to another user with whom they have an accepted match.

**Request Body**

```json
{
  "receiverId": 789,
  "content": "Hello, how are you?"
}
```

**Validation**

- `receiverId`: Required, number (The ID of the user to send the message to).
- `content`: Required, string, max 1000 chars.

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Message sent successfully.",
  "data": {
    // The new message object
  }
}
```

### 2. Get Chat History

- **Endpoint**: `GET /api/v1/messages/:userId`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`
- **Business Logic**: Retrieves the message history between the logged-in user and the user specified by `userId`.

**Path Params**

- `userId`: `number` (The ID of the other user in the conversation).

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 50)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Messages retrieved successfully.",
  "data": {
    "results": [
      // array of message objects
    ],
    "page": 1,
    "limit": 50,
    "totalPages": 3,
    "totalResults": 120
  }
}
```

### 3. Get Chat List (Conversations)

- **Endpoint**: `GET /api/v1/messages/`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`
- **Business Logic**: Retrieves a list of all conversations for the logged-in user, showing the last message for each.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Chat list retrieved successfully.",
  "data": [
    // array of conversation objects, each with the other user's profile and the last message
  ]
}
```


---

## NOTIFICATIONS

This section covers user notifications for various events within the app.

### 1. Get My Notifications

- **Endpoint**: `GET /api/v1/notifications`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 20)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully.",
  "data": {
    "results": [
      // array of notification objects
    ],
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalResults": 5
  }
}
```

### 2. Mark Notifications as Read

- **Endpoint**: `POST /api/v1/notifications/mark-read`
- **Auth Required**: Yes
- **Middleware**: `authenticate`

**Request Body**: None

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Notifications marked as read.",
  "data": {}
}
```

### 3. Get Notification Settings

- **Endpoint**: `GET /api/v1/notification-settings`
- **Auth Required**: Yes
- **Middleware**: `authenticate`

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Notification settings retrieved successfully.",
  "data": {
    // The user's notification settings object
  }
}
```

### 4. Update Notification Settings

- **Endpoint**: `PUT /api/v1/notification-settings`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `validate`

**Request Body**

```json
{
  "newMatches": true,
  "newMessages": false,
  "profileViews": true,
  "contactRequests": false
}
```

**Validation**

- All fields are optional booleans.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Notification settings updated successfully.",
  "data": {
    // The updated notification settings object
  }
}
```


---

## REPORTS

This section allows users to report other users for inappropriate behavior or content.

### 1. Report a User

- **Endpoint**: `POST /api/v1/reports`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Request Body**

```json
{
  "reportedUserId": 123,
  "reason": "Inappropriate photos",
  "description": "The user has photos that violate the community guidelines.",
  "reportType": "PROFILE"
}
```

**Validation**

- `reportedUserId`: Required, number.
- `reason`: Required, string, min 5 chars.
- `reportType`: Required, string, enum (`PROFILE`, `MESSAGE`, `PHOTO`).

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Report submitted successfully.",
  "data": {
    // The new report object
  }
}
```


---

## SHORTLISTS

This section allows users to shortlist profiles they are interested in.

### 1. Add to Shortlist

- **Endpoint**: `POST /api/v1/shortlists`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Request Body**

```json
{
  "profileId": 789
}
```

**Validation**

- `profileId`: Required, number.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Profile added to shortlist.",
  "data": {}
}
```

### 2. Get My Shortlist

- **Endpoint**: `GET /api/v1/shortlists`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 20)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Shortlist retrieved successfully.",
  "data": {
    "results": [
      // array of shortlisted profile objects
    ],
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalResults": 10
  }
}
```

### 3. Remove from Shortlist

- **Endpoint**: `DELETE /api/v1/shortlists/:profileId`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`

**Path Params**

- `profileId`: `number` (The ID of the profile to remove from the shortlist).

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Profile removed from shortlist.",
  "data": {}
}
```

---

## PHOTO VIEW REQUESTS

This section outlines the process for requesting, viewing, and managing access to users' private photos.

### 1. Send a Photo View Request

- **Endpoint**: `POST /api/v1/photo-requests`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `requireSubscription`, `validate`
- **Description**: Sends a request to another user to view one of their private photos. Requires an active subscription.

**Request Body**

```json
{
  "photoId": 123,
  "message": "I'd like to see this photo, it looks interesting from the blur!"
}
```

**Validation**

- `photoId`: Required, number (The ID of the photo you want to view).
- `message`: Optional, string, max 500 chars.

**Response**

- **201 Created**

```json
{
  "success": true,
  "message": "Photo view request sent successfully.",
  "data": {
    // The new photo request object
  }
}
```

### 2. Get Sent Photo View Requests

- **Endpoint**: `GET /api/v1/photo-requests/sent`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`
- **Description**: Retrieves a paginated list of photo view requests that the logged-in user has sent.

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 10)
- `status`: `string` (optional, filter by `PENDING`, `APPROVED`, or `REJECTED`)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Sent photo requests retrieved successfully.",
  "data": {
    "results": [
      // array of sent photo request objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 5
  }
}
```

### 3. Get Received Photo View Requests

- **Endpoint**: `GET /api/v1/photo-requests/received`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`
- **Description**: Retrieves a paginated list of photo view requests that the logged-in user has received from other users.

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, default: 10)
- `status`: `string` (optional, filter by `PENDING`, `APPROVED`, or `REJECTED`)

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Received photo requests retrieved successfully.",
  "data": {
    "results": [
      // array of received photo request objects
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "totalResults": 12
  }
}
```

### 4. Respond to a Photo View Request

- **Endpoint**: `POST /api/v1/photo-requests/:id/respond`
- **Auth Required**: Yes
- **Middleware**: `authenticate`, `requireCompleteProfile`, `validate`
- **Description**: Allows a user to approve or reject a received photo view request.

**Path Params**

- `id`: `number` (The ID of the photo request to respond to).

**Request Body**

```json
{
  "status": "APPROVED"
}
```

**Validation**

- `status`: Required, string, must be either `APPROVED` or `REJECTED`.

**Response**

- **200 OK**

```json
{
  "success": true,
  "message": "Successfully responded to photo request.",
  "data": {
    // The updated photo request object
  }
}
```


---

## PHOTO PRIVACY MANAGEMENT

This section allows a user to control the privacy settings for their individual photos.

### 1. Get Photo Privacy Settings

-   **Endpoint**: `GET /api/v1/photos/:mediaId/privacy`
-   **Auth Required**: Yes
-   **Middleware**: `authenticate`, `validate`
-   **Description**: Retrieves the current privacy settings for a specific photo owned by the logged-in user.

**Path Params**

-   `mediaId`: `number` (Required, The ID of the photo to get settings for).

**Response**

-   **200 OK**

```json
{
    "success": true,
    "message": "Photo privacy settings retrieved successfully.",
    "data": {
        "visibility": "REGISTERED",
        "enableWatermark": true,
        "watermarkText": "My Profile",
        "watermarkPosition": "BOTTOM_RIGHT",
        "preventScreenshots": false,
        "disableRightClick": true,
        "blurForNonPremium": true,
        "blurLevel": "MEDIUM",
        "allowDownload": false,
        "allowViewRequests": true,
        "autoApprovePremium": true,
        "autoApproveVerified": false
    }
}
```

### 2. Update Photo Privacy Settings

-   **Endpoint**: `PUT /api/v1/photos/:mediaId/privacy`
-   **Auth Required**: Yes
-   **Middleware**: `authenticate`, `validate`
-   **Description**: Updates the privacy settings for a specific photo owned by the logged-in user.

**Path Params**

-   `mediaId`: `number` (Required, The ID of the photo to update).

**Request Body** (All fields are optional)

```json
{
    "visibility": "MATCHED",
    "enableWatermark": true,
    "watermarkText": "Confidential",
    "watermarkPosition": "CENTER",
    "preventScreenshots": true,
    "disableRightClick": true,
    "blurForNonPremium": true,
    "blurLevel": "HIGH",
    "allowDownload": false,
    "allowViewRequests": false,
    "autoApprovePremium": false,
    "autoApproveVerified": false
}
```

**Validation & Options**

-   `visibility`: `string` (Enum: `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `enableWatermark`: `boolean`
-   `watermarkText`: `string` (Max 100 chars)
-   `watermarkPosition`: `string` (Enum: `BOTTOM_RIGHT`, `CENTER`, `TOP_LEFT`)
-   `preventScreenshots`: `boolean`
-   `disableRightClick`: `boolean`
-   `blurForNonPremium`: `boolean`
-   `blurLevel`: `string` (Enum: `LOW`, `MEDIUM`, `HIGH`)
-   `allowDownload`: `boolean`
-   `allowViewRequests`: `boolean` (Whether to allow users to request access to this photo if it's hidden from them)
-   `autoApprovePremium`: `boolean` (Automatically approve view requests from premium users)
-   `autoApproveVerified`: `boolean` (Automatically approve view requests from verified users)

**Response**

-   **200 OK**

```json
{
    "success": true,
    "message": "Photo privacy settings updated successfully.",
    "data": {
        // The updated photo privacy object
    }
}
```


---

## GENERAL PRIVACY SETTINGS

This section covers endpoints for managing a user's overall profile privacy, communication preferences, search visibility, and account security. All endpoints require authentication.

---

### 1. Profile Privacy

Controls the visibility of individual fields on a user's profile.

#### Get Profile Privacy Settings

-   **Endpoint**: `GET /api/v1/privacy/profile`
-   **Description**: Retrieves the current visibility settings for the logged-in user's profile fields.

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Profile privacy settings retrieved.",
    "data": {
        "profileVisibility": "REGISTERED",
        "showLastName": true,
        "showEmail": "MATCHED",
        // ... other settings
    }
}
```

#### Update Profile Privacy Settings

-   **Endpoint**: `PUT /api/v1/privacy/profile`
-   **Description**: Updates the visibility settings for the logged-in user's profile.

**Request Body** (All fields are optional)

-   `profileVisibility`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showLastName`: `boolean`
-   `showExactAge`: `boolean`
-   `showDateOfBirth`: `boolean`
-   `showPhoneNumber`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showEmail`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showSocialMedia`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showExactLocation`: `boolean`
-   `showCity`: `boolean`
-   `showState`: `boolean`
-   `showCompanyName`: `boolean`
-   `showAnnualIncome`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showWorkLocation`: `boolean`
-   `showFamilyDetails`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showParentOccupation`: `boolean`
-   `showSiblingDetails`: `boolean`
-   `showHoroscope`: `boolean`
-   `showHoroscopeTo`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showBirthTime`: `boolean`
-   `showBirthPlace`: `boolean`
-   `showDiet`: `boolean`
-   `showSmokingDrinking`: `string` (Enum: `PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`)
-   `showLastActive`: `boolean`
-   `showOnlineStatus`: `boolean`
-   `showProfileViews`: `boolean`
-   `showWhoViewedProfile`: `boolean`
-   `showShortlistedBy`: `boolean`
-   `showNativeDistrict`: `boolean`
-   `showNativeVillage`: `boolean`

**Response (200 OK)**: Returns the updated profile privacy object.

---

### 2. Communication Settings

Manages who can contact the user and how.

#### Get Communication Settings

-   **Endpoint**: `GET /api/v1/privacy/communication`
-   **Description**: Retrieves the user's current communication preferences.

**Response (200 OK)**: Returns the communication settings object.

#### Update Communication Settings

-   **Endpoint**: `PUT /api/v1/privacy/communication`
-   **Description**: Updates the user's communication preferences.

**Request Body** (All fields are optional)

-   `allowMatchRequestsFrom`: `string` (Enum: `EVERYONE`, `MATCHED_ONLY`, `HIDDEN`)
-   `minAgeForRequests`: `number` (Integer, min 18)
-   `maxAgeForRequests`: `number` (Integer, max 100)
-   `allowedReligions`: `array` of `string`
-   `allowedLocations`: `array` of `string`
-   `minEducationLevel`: `string` (Enum from `EDUCATION_LEVEL`)
-   `allowMessagesFrom`: `string` (Enum: `EVERYONE`, `MATCHED_ONLY`)
-   `blockUnverifiedProfiles`: `boolean`
-   `requireMinProfileCompleteness`: `number` (Integer, 0-100)
-   `allowAnonymousViews`: `boolean`
-   `notifyOnView`: `boolean`
-   `blockRepeatedViews`: `boolean`
-   `autoResponseEnabled`: `boolean`
-   `autoResponseMessage`: `string` (Max 1000 chars)
-   `sendAutoResponseToNewMatches`: `boolean`
-   `maxMatchRequestsPerDay`: `number` (Positive integer)
-   `maxMessagesPerDay`: `number` (Positive integer)
-   `preferChhattisgarhi`: `boolean`

**Response (200 OK)**: Returns the updated communication settings object.

---

### 3. Search Visibility Settings

Controls how the user's profile appears in search results and suggestions.

#### Get Search Visibility Settings

-   **Endpoint**: `GET /api/v1/privacy/search`
-   **Description**: Retrieves the user's current search visibility settings.

**Response (200 OK)**: Returns the search visibility object.

#### Update Search Visibility Settings

-   **Endpoint**: `PUT /api/v1/privacy/search`
-   **Description**: Updates the user's search visibility settings.

**Request Body** (All fields are optional)

-   `showInSearch`: `boolean`
-   `showInSuggestions`: `boolean`
-   `visibleToFreeUsers`: `boolean`
-   `visibleToPremiumUsers`: `boolean`
-   `visibleToVerifiedUsers`: `boolean`
-   `showOnlyInCountry`: `boolean`
-   `showOnlyInState`: `boolean`
-   `showOnlyInCity`: `boolean`
-   `excludedCountries`: `array` of `string`
-   `showOnlyToAgeRange`: `boolean`
-   `visibleMinAge`: `number` (Integer, min 18)
-   `visibleMaxAge`: `number` (Integer, max 100)
-   `incognitoEnabled`: `boolean`
-   `hideFromSearch`: `boolean`
-   `hideLastActive`: `boolean`
-   `browseAnonymously`: `boolean`
-   `profilePaused`: `boolean`
-   `pauseReason`: `string` (Max 100 chars)
-   `pausedUntil`: `string` (ISO 8601 datetime)
-   `showOnlyInChhattisgarh`: `boolean`
-   `prioritizeChhattisgarhi`: `boolean`

**Response (200 OK)**: Returns the updated search visibility object.

---

### 4. Account Security Settings

Manages security-related features for the user's account.

#### Get Account Security Settings

-   **Endpoint**: `GET /api/v1/privacy/security`
-   **Description**: Retrieves the user's current account security settings.

**Response (200 OK)**: Returns the account security settings object.

#### Update Account Security Settings

-   **Endpoint**: `PUT /api/v1/privacy/security`
-   **Description**: Updates the user's account security settings.

**Request Body** (All fields are optional)

-   `twoFactorEnabled`: `boolean`
-   `twoFactorMethod`: `string` (Enum: `SMS`, `EMAIL`, `BOTH`)
-   `requireOtpNewDevice`: `boolean`
-   `requireOtpNewLocation`: `boolean`
-   `sessionTimeout`: `number` (Positive integer, in minutes)
-   `maxActiveSessions`: `number` (Positive integer)
-   `recoveryEmail`: `string` (Valid email format)
-   `recoveryPhone`: `string` (Valid Indian phone number format)

**Response (200 OK)**: Returns the updated account security object.


# Additional API Documentation

This document provides detailed information for specific API sections that require more in-depth explanation, including Admin, Agents, Uploads, Payments, Profile Views, and Subscriptions.

---

## ADMIN & AGENTS

This section covers all administrator-level operations. All endpoints are prefixed with `/api/v1/admin` and require an `ADMIN` user role.

### User Management

- **GET /users**: Get a paginated list of all users.
  - **Query Params**: `page`, `limit`
- **GET /users/recent**: Get a list of the most recently registered users.
  - **Query Params**: `limit`
- **GET /users/:userId**: Get detailed information for a specific user by their ID.
- **PUT /users/:userId/role**: Update the role of a specific user.
  - **Request Body**: `{ "role": "USER" | "ADMIN" | "AGENT" }`
- **DELETE /users/:userId**: Delete a user account.

### Profile Management

- **GET /profiles**: Get a paginated list of all user profiles.
  - **Query Params**: `page`, `limit`

### Platform Stats & Health

- **GET /matches/recent**: Get a list of the most recent matches made on the platform.
  - **Query Params**: `limit`
- **GET /stats**: Get key dashboard statistics (e.g., total users, active subscriptions, etc.).
- **POST /cleanup/tokens**: A utility endpoint to clean up expired refresh tokens from the database.

### Report Management

- **GET /reports**: Get a paginated list of all user-submitted reports.
  - **Query Params**: `page`, `limit`, `status` (`PENDING`, `REVIEWED`, `CLOSED`)
- **GET /reports/:id**: Get details of a specific report.
- **PUT /reports/:id**: Update the status and notes of a report.
  - **Request Body**: `{ "status": "REVIEWED", "reviewNote": "...", "actionTaken": "..." }`

### Agent Management (under `/agents`)

- **POST /**: Create a new agent.
  - **Description**: Registers a new agent with detailed information.
  - **Request Body**: A complex object containing fields for `agentCode`, `agentName`, contact info, business details (GST, PAN), commission settings, and banking information.

- **GET /**: Get a list of all agents.
  - **Description**: Retrieves a paginated and searchable list of all agents.
  - **Query Params**: `page`, `limit`, `status`, `district`, `search`

- **GET /:agentId**: Get a specific agent by their ID.

- **PUT /:agentId**: Update an agent's information.
  - **Request Body**: An object with any of the fields from the creation schema.

- **DELETE /:agentId**: Delete an agent.

---

## UPLOADS

This section covers the endpoints for uploading user content like profile pictures and identity documents. All routes require authentication.

### 1. Upload Main Profile Photo

-   **Endpoint**: `POST /api/v1/uploads/profile-photo`
-   **Auth Required**: Yes
-   **Content-Type**: `multipart/form-data`
-   **Description**: Uploads a single photo to be used as the user's primary profile picture. The server handles image compression and conversion to WEBP format.

**Form Data**

-   `profile-photo`: `file` (Required, The image file to upload. Max size: 5MB. Allowed types: JPEG, PNG, WEBP).

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Profile photo uploaded successfully.",
    "data": {
        "mediaUrl": "https://storage.googleapis.com/.../profile-photo.webp"
    }
}
```

### 2. Upload to Photo Gallery

-   **Endpoint**: `POST /api/v1/uploads/profile-photos`
-   **Auth Required**: Yes
-   **Content-Type**: `multipart/form-data`
-   **Description**: Uploads one or more photos to the user's photo gallery. Supports up to 5 photos in a single request.

**Form Data**

-   `profile-photos`: `file[]` (Required, An array of image files. Max 5 files. Max size per file: 5MB. Allowed types: JPEG, PNG, WEBP).

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Photos uploaded successfully.",
    "data": {
        "mediaUrls": [
            "https://storage.googleapis.com/.../photo-1.webp",
            "https://storage.googleapis.com/.../photo-2.webp"
        ]
    }
}
```

### 3. Upload ID Proof Document

-   **Endpoint**: `POST /api/v1/uploads/id-proof`
-   **Auth Required**: Yes
-   **Content-Type**: `multipart/form-data`
-   **Description**: Uploads a document to be used for identity verification. This helps in getting the 'Verified' badge on a profile.

**Form Data**

-   `document`: `file` (Required, The document file. Max size: 10MB. Allowed types: JPEG, PNG, WEBP, PDF).

**Response (200 OK)**

```json
{
    "success": true,
    "message": "ID proof uploaded successfully. It will be reviewed by our team.",
    "data": {
        "mediaUrl": "https://storage.googleapis.com/.../id-document.pdf"
    }
}
```

---

## PAYMENTS

This section outlines the process for handling payments, specifically for purchasing subscription plans using Razorpay as the payment gateway.

### 1. Create a Payment Order

-   **Endpoint**: `POST /api/v1/payments/orders`
-   **Auth Required**: Yes
-   **Description**: Creates a payment order in Razorpay. This is the first step in the payment process. The server-side order is created, and the `order_id` is returned to the client to initialize the Razorpay checkout.

**Request Body**

```json
{
  "planId": 1
}
```

**Validation**

-   `planId`: `number` (Required, The ID of the subscription plan to purchase).

**Response (200 OK)**

Returns the Razorpay order details required by the client-side SDK.

```json
{
    "success": true,
    "message": "Order created successfully",
    "data": {
        "orderId": "order_Jv...",
        "amount": 199900, // Amount in the smallest currency unit (e.g., paisa)
        "currency": "INR",
        "planName": "Premium Plan"
    }
}
```

### 2. Verify Payment

-   **Endpoint**: `POST /api/v1/payments/verify`
-   **Auth Required**: Yes
-   **Description**: Verifies the payment after the user completes the transaction on the Razorpay checkout. The client submits the payment details it receives from Razorpay, and the server verifies the signature to confirm the payment's authenticity. If successful, the user's subscription is activated.

**Request Body**

```json
{
  "razorpay_order_id": "order_Jv...",
  "razorpay_payment_id": "pay_Jv...",
  "razorpay_signature": "..."
}
```

**Validation**

-   All fields are required `string`s.

**Response (200 OK)**

```json
{
    "success": true,
    "message": "Payment verified and subscription activated successfully!",
    "data": {
        "paymentId": 123,
        "status": "COMPLETED",
        "planId": 1
    }
}
```

### 3. Get My Payment History

-   **Endpoint**: `GET /api/v1/payments/me`
-   **Auth Required**: Yes
-   **Description**: Retrieves a paginated list of the logged-in user's payment history.

**Response (200 OK)**

Returns an array of payment records.

### 4. Get Payment by ID

-   **Endpoint**: `GET /api/v1/payments/:paymentId`
-   **Auth Required**: Yes
-   **Description**: Retrieves the details of a single payment by its ID.

**Path Params**

-   `paymentId`: `number` (Required, The ID of the payment to retrieve).

### 5. Handle Razorpay Webhook

-   **Endpoint**: `POST /api/v1/payments/webhook`
-   **Auth Required**: No
-   **Description**: An endpoint for Razorpay to send server-to-server notifications about payment events (e.g., payment failed, refund processed). This is not intended to be called by the client. It ensures payment status is synchronized even if the user closes their browser after payment.

---

## PROFILE VIEWS

This section covers endpoints for tracking and retrieving profile view history.

### 1. Log a Profile View

-   **Endpoint**: `POST /api/v1/profile-views`
-   **Auth Required**: Yes, with a complete profile.
-   **Description**: Logs an event when the authenticated user views another user's profile. This is typically called when a user's profile page is loaded.

**Request Body**

```json
{
  "profileId": 456, // The userId of the profile being viewed
  "isAnonymous": false // Optional: Set to true if the viewer has incognito mode enabled
}
```

**Validation**

-   `profileId`: `number` (Required).
-   `isAnonymous`: `boolean` (Optional).

**Response (201 Created)**

```json
{
    "success": true,
    "message": "Profile view logged successfully.",
    "data": { ... } // The new view log object
}
```

### 2. Get Who Viewed My Profile

-   **Endpoint**: `GET /api/v1/profile-views/who-viewed-me`
-   **Auth Required**: Yes, with a complete profile.
-   **Description**: Retrieves a paginated list of users who have viewed the logged-in user's profile.

**Query Parameters**

-   `page`, `limit`: For pagination.

**Response (200 OK)**

Returns an array of profiles, excluding anonymous viewers.

### 3. Get My View History

-   **Endpoint**: `GET /api/v1/profile-views/my-history`
-   **Auth Required**: Yes, with a complete profile.
-   **Description**: Retrieves a paginated list of profiles that the logged-in user has viewed.

**Query Parameters**

-   `page`, `limit`: For pagination.

**Response (200 OK)**

Returns an array of profiles that the current user has viewed.

---

## SUBSCRIPTION

This section is for retrieving information about available subscription plans.
*Note: The creation and activation of a subscription is handled by the `POST /api/v1/payments/verify` endpoint.*

### 1. Get Active Subscription Plans

- **Endpoint**: `GET /api/v1/subscription`
- **Auth Required**: Yes
- **Description**: Retrieves a list of all currently active subscription plans that users can purchase.

**Query Parameters**

- `page`: `number` (optional, for pagination, default: 1)
- `limit`: `number` (optional, for pagination, ault: 10)

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Plans retrieved successfully.",
  "data": {
    "results": [
      {
          "id": 1,
          "name": "Premium - 3 Months",
          "price": 1999,
          "durationDays": 90,
          "features": ["Send unlimited messages", "View contact details", "..."],
          "isActive": true
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 3
  }
}
```
