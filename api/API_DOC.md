Ready — send the GitHub repo link: [https://github.com/pushp314/chhattisgarhshadi-backend.git](https://github.com/pushp314/chhattisgarhshadi-backend.git)


Here is the complete, frontend-focused API documentation for the Chhattisgarh Shadi backend, based on the provided repository files.

## 1\. System Summary

### Tech Stack

  * **Backend:** Node.js, Express.js
  * **Database:** PostgreSQL
  * **ORM:** Prisma
  * **Authentication:** JSON Web Tokens (JWT) with Google OAuth 2.0
  * **Realtime:** Socket.io
  * **File Uploads:** Multer, Sharp (for image processing), AWS S3
  * **Payments:** Razorpay
  * **Notifications:** Firebase Cloud Messaging (FCM)
  * **SMS/OTP:** MSG91
  * **Validation:** Zod
  * **Deployment:** Render

### Folder Structure Overview

The backend follows a standard layered architecture:

  * `src/routes`: Defines all API endpoints and links them to controllers.
  * `src/validation`: Contains all `zod` schemas used to validate request bodies, query params, and path params.
  * `src/middleware`: Holds all middleware, including authentication (`auth.js`), validation (`validate.middleware.js`), and error handling (`error-handler.middleware.js`).
  * `src/controllers`: Receives requests from routes, parses them, calls services, and sends responses.
  * `src/services`: Contains all business logic and database (Prisma) interactions.
  * `src/socket`: Manages all real-time WebSocket connections and event handlers.
  * `src/utils`: Provides utility classes (`ApiError`, `ApiResponse`) and helper functions (`asyncHandler`, `constants.js`).
  * `src/config`: Manages initialization for third-party services (DB, AWS, Firebase, etc.).
  * `prisma`: Contains the `schema.prisma` file, which is the single source of truth for database models.

### Database Models Overview

The `prisma/schema.prisma` file defines several key models:

  * **Core Models:** `User` (handles auth, roles, and account status) and `Profile` (handles all user-facing biographical data like name, DOB, bio, location, etc.).
  * **Auth Models:** `RefreshToken` (stores active refresh tokens for JWT), `PhoneVerification` (stores one-time OTPs), `FcmToken` (stores device tokens for push notifications).
  * **Profile Sub-models:** `Education`, `Occupation`, `Media` (photos/documents), `PartnerPreference`.
  * **Social/Interaction Models:** `MatchRequest`, `Message`, `ProfileView`, `Shortlist`, `BlockedUser`, `Report`.
  * **Payment Models:** `SubscriptionPlan` (defined by admin), `UserSubscription` (links user to a plan), `Payment` (tracks Razorpay transactions).
  * **Privacy Models:** A granular system including `ProfilePrivacySettings`, `PhotoPrivacySettings`, `CommunicationPreferences`, `SearchVisibilitySettings`, and `AccountSecuritySettings`.
  * **Agent & Admin Models:** `Admin` (for backend staff), `Agent` (for referral agents managed by admins).

### Authentication Flow

Authentication is **Google OAuth 2.0 ONLY**. There is no email/password registration.

1.  **Frontend Sign-In:** The React Native app uses a Google Sign-In SDK (`expo-auth-session`) to initiate the OAuth flow and receive an `authorizationCode` or a legacy `idToken`.
2.  **Backend Auth:** The frontend sends a `POST` request to `/api/v1/auth/google`. The backend auto-detects whether an `authorizationCode` or `idToken` is provided and verifies it with Google.
3.  **User Creation:** If the user doesn't exist, a new `User` is created. If they do, their `lastLoginAt` is updated.
4.  **Token Generation:** The backend generates two JWTs:
      * **`accessToken`**: Short-lived (15 minutes), used for API authorization.
      * **`refreshToken`**: Long-lived (7 days), stored in the `RefreshToken` database table.
5.  **Response:** The backend returns the `user` object, `accessToken`, and `refreshToken` to the frontend.
6.  **Authenticated Requests:** The frontend must store the tokens. All subsequent requests to protected endpoints must include the `Authorization: Bearer <accessToken>` header.
7.  **Token Refresh:** When the `accessToken` expires (or on app start), the frontend sends the `refreshToken` to `POST /api/v1/auth/refresh` to get a new pair of tokens.

**Note on Phone OTP:** The routes `POST /api/v1/auth/phone/send-otp` and `POST /api/v1/auth/phone/verify-otp` are **not for login**. They are for one-time verification *after* a user is already logged in.

### Authorization & Roles

Authorization is handled by middleware specified in `src/middleware/auth.js`:

  * `authenticate`: The base-level middleware. It verifies the `accessToken` and attaches the `User` object (with their `profile`) to `req.user`. This is required for almost all routes.
  * `requireCompleteProfile`: An additional check that requires `req.user.profile.profileCompleteness >= 50`. This is used on all social interaction routes (matching, messaging, searching) to ensure users have a baseline profile.
  * `requireSubscription`: An additional check that requires the user to have an `ACTIVE` subscription. This is used for premium features like sending contact or photo requests.
  * `requireAdmin`: Restricts access to `ADMIN` or `SUPER_ADMIN` roles. Used for the entire `/api/v1/admin` route tree.

### Key Middleware Behavior

  * **Validation:** All requests are validated using `zod` schemas. If validation fails, the API returns a `422 Unprocessable Entity` error with a detailed `errors` array.
  * **Rate Limiting:**
      * General routes have a limit of 100 requests/15 minutes.
      * Auth routes (`/api/v1/auth`) have a stricter limit (200 requests/2 minutes).
      * OTP sending (`/auth/phone/send-otp`) is the strictest (3 requests/15 minutes).
  * **Error Handling:** All errors are caught by a central `errorHandler` and formatted into a consistent JSON response: `{ success: false, statusCode, message, errors?, stack? }`.
  * **Block Filtering:** The backend services automatically filter out content from blocked users. For example, `GET /api/v1/profiles/search` will *not* include users who have blocked the requester or been blocked by them. This logic is handled in the services (e.g., `blockService.getAllBlockedUserIds`).

-----

## 2\. API Endpoints Documentation

**Base URL:** `/api/v1`

### Health Check

#### `GET /health`

  * **Purpose:** Checks the health of the API and its downstream services (DB, Firebase, AWS, etc.).
  * **Auth:** None
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "status": "healthy",
      "message": "✅ API is healthy and running",
      "timestamp": "2025-11-17T14:30:00.000Z",
      "uptime": 120,
      "environment": "development",
      "version": "1.0.0",
      "services": {
        "database": { "status": "✅ Connected", ... },
        "socket": { "status": "✅ Running", ... },
        "firebase": { "status": "⚠️ Not configured", ... },
        "aws": { "status": "⚠️ Not configured", ... },
        "msg91": { "status": "⚠️ Not configured", ... },
        "razorpay": { "status": "⚠️ Not configured", ... }
      },
      ...
    }
    ```

-----

### Authentication (`/auth`)

#### `POST /auth/google`

  * **Purpose:** The primary endpoint for login and registration. It accepts either a Google OAuth `authorizationCode` (recommended) or a legacy `idToken`.
  * **Auth:** None. Rate-limited.
  * **Request Body Schema:** `application/json`
    ```typescript
    interface GoogleAuthRequest {
      authorizationCode?: string; // From Google SDK (Web/expo-auth-session)
      redirectUri?: string;     // Required if using authorizationCode
      idToken?: string;         // From Google SDK (Legacy)
      deviceInfo?: {
        deviceId?: string;
        deviceName?: string;
        deviceType?: 'IOS' | 'ANDROID' | 'WEB';
        userAgent?: string;
      };
      agentCode?: string; // Optional: For agent-referred signups
    }
    ```
  * **Request Body Example (Web-Based Flow):**
    ```json
    {
      "authorizationCode": "4/0Aean...",
      "redirectUri": "http://localhost:8080/auth/google/callback",
      "deviceInfo": {
        "deviceId": "unique_device_id",
        "deviceName": "iPhone 14 Pro",
        "deviceType": "IOS"
      },
      "agentCode": "AGENT001"
    }
    ```
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "user": {
          "id": 1,
          "email": "user@example.com",
          "googleId": "12345...",
          "profilePicture": "url_to_picture",
          "role": "USER",
          "preferredLanguage": "HI",
          "isPhoneVerified": false,
          "profile": null
        },
        "accessToken": "jwt_access_token (15m)",
        "refreshToken": "jwt_refresh_token (7d)",
        "expiresIn": "15m",
        "isNewUser": true
      },
      "message": "Account created successfully"
    }
    ```
  * **Validation Rules:**
      * Must provide *either* `authorizationCode` or `idToken`.
  * **Special Notes:**
      * If `isNewUser` is `true`, the frontend must navigate to the profile creation flow.
      * If a valid `agentCode` is passed for a new user, the user is linked to that agent.

#### `POST /auth/refresh`

  * **Purpose:** Renews an expired `accessToken` using a valid `refreshToken`.
  * **Auth:** None. Rate-limited.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "refreshToken": "your_refresh_token"
    }
    ```
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "accessToken": "new_jwt_access_token",
        "refreshToken": "new_jwt_refresh_token",
        "expiresIn": "15m"
      },
      "message": "Token refreshed successfully"
    }
    ```

#### `POST /auth/logout`

  * **Purpose:** Logs the user out by revoking their `refreshToken`.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json`
    ```json
    {
      "refreshToken": "your_refresh_token"
    }
    ```
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": null,
      "message": "Logged out successfully"
    }
    ```
  * **Special Notes:**
      * If `refreshToken` is provided, only that token/device is logged out.
      * If `refreshToken` is *omitted*, all refresh tokens for the user are revoked (logout from all devices).

#### `POST /auth/phone/send-otp`

  * **Purpose:** Sends a 6-digit OTP to the user's phone for one-time verification.
  * **Auth:** JWT (`authenticate`). Rate-limited (`otpLimiter`).
  * **Request Body Schema:** `application/json`
    ```json
    {
      "phone": "9876543210",
      "countryCode": "+91"
    }
    ```
  * **Success Response (200):**
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
  * **Validation Rules:**
      * `phone`: Must match Indian phone regex `  /^[6-9]\d{9}$/ `.
  * **Error Responses:**
      * `400 Bad Request`: "Phone already verified".
      * `409 Conflict`: "Phone number already registered" (by another user).

#### `POST /auth/phone/verify-otp`

  * **Purpose:** Verifies the 6-digit OTP sent to the user's phone.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json`
    ```json
    {
      "phone": "9876543210",
      "otp": "123456"
    }
    ```
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": null,
      "message": "Phone verified successfully"
    }
    ```
  * **Validation Rules:**
      * `otp`: Must be a 6-digit string.
  * **Error Responses:**
      * `400 Bad Request`: "OTP expired or not found" or "Invalid OTP...".
      * `429 Too Many Requests`: "Maximum OTP attempts exceeded".

-----

### User Management (`/users`)

#### `GET /users/me`

  * **Purpose:** Gets the full, detailed profile for the *currently authenticated* user.
  * **Auth:** JWT (`authenticate`)
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "id": 1,
        "email": "user@example.com",
        "googleId": "12345...",
        "phone": "+919876543210",
        "isPhoneVerified": true,
        "profilePicture": "/uploads/profiles/1/photo.jpg",
        "role": "USER",
        "preferredLanguage": "HI",
        "isActive": true,
        "isBanned": false,
        "createdAt": "2025-11-17T...Z",
        "profile": {
          "id": 1,
          "firstName": "Ramesh",
          "lastName": "Kumar",
          "gender": "MALE",
          "dateOfBirth": "1990-01-15",
          "city": "Raipur",
          "profileCompleteness": 75,
          ...
        },
        "agent": {
          "agentCode": "AGENT001",
          "agentName": "Agent Name"
        }
      },
      "message": "Profile retrieved successfully"
    }
    ```

#### `PUT /users/me`

  * **Purpose:** Updates limited, safe fields on the authenticated user's `User` model.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json`
    ```typescript
    interface UpdateMeRequest {
      profilePicture?: string; // Must be a full URL
      preferredLanguage?: 'EN' | 'HI' | 'CG';
    }
    ```
  * **Success Response (200):** Returns the updated `User` object (see `GET /users/me`).

#### `DELETE /users/me`

  * **Purpose:** Soft-deletes the authenticated user's account.
  * **Auth:** JWT (`authenticate`)
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": null,
      "message": "Account deactivated successfully"
    }
    ```
  * **Special Notes:** This is a **soft delete**. It sets `isActive: false`, `isBanned: true`, anonymizes PII (email, googleId, phone), and revokes all tokens.

#### `POST /users/fcm-token`

  * **Purpose:** Registers or updates a Firebase Cloud Messaging (FCM) token for push notifications.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json`
    ```json
    {
      "token": "fcm_device_token_string",
      "deviceId": "unique_device_identifier",
      "deviceType": "IOS",
      "deviceName": "iPhone 14 Pro"
    }
    ```
  * **Validation Rules:**
      * `token`, `deviceId` are required.
      * `deviceType` must be one of: `IOS`, `ANDROID`, `WEB`.
  * **Success Response (200):** Returns the created/updated `FcmToken` object.
  * **Special Notes:** This performs an `upsert` based on the `(userId, deviceId)` unique constraint.

#### `GET /users/search`

  * **Purpose:** A simple, paginated search for users.
  * **Auth:** JWT (`authenticate`)
  * **Query Params:**
      * `search` (string, optional): Searches `firstName`, `lastName`, and `profileId`.
      * `role` (enum, optional): `USER`, `PREMIUM_USER`, `VERIFIED_USER`, `ADMIN`.
      * `page` (number, optional): Default: 1.
      * `limit` (number, optional): Default: 10, Max: 100.
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "users": [
          {
            "id": 2,
            "profilePicture": "...",
            "role": "USER",
            "preferredLanguage": "HI",
            "createdAt": "2025-11-16T...Z",
            "profile": { ... }
          }
        ],
        "pagination": {
          "currentPage": 1,
          "totalPages": 1,
          "totalItems": 1,
          "itemsPerPage": 10,
          "hasNextPage": false,
          "hasPrevPage": false
        }
      },
      "message": "Users retrieved successfully"
    }
    ```
  * **Special Notes:** Automatically filters out the user themselves and any blocked users.

#### `GET /users/:id`

  * **Purpose:** Gets another user's public-facing profile by their User ID.
  * **Auth:** JWT (`authenticate`)
  * **Path Params:**
      * `id` (number): The `User ID` of the person to fetch.
  * **Success Response (200):** Returns the *public-safe* user object (no email, phone, etc.).
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "id": 2,
        "profilePicture": "...",
        "role": "USER",
        "preferredLanguage": "HI",
        "createdAt": "2025-11-16T...Z",
        "profile": { ... }
      },
      "message": "User retrieved successfully"
    }
    ```
  * **Error Responses:**
      * `404 Not Found`: If the user doesn't exist OR if the user is blocked by/has blocked the requester.

-----

### Profile Management (`/profiles`)

#### `POST /profiles`

  * **Purpose:** Creates the user's main profile after registration. This is a one-time setup.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json` (See `src/validation/profile.validation.js` for all fields. All fields from `Profile` model are available, many are optional.)
  * **Required Fields:** `firstName`, `lastName`, `dateOfBirth` (ISO 8601 string), `gender` (enum), `maritalStatus` (enum), `religion` (enum), `motherTongue` (enum), `country`, `state`, `city`.
  * **Request Body Example:**
    ```json
    {
      "firstName": "Ramesh",
      "lastName": "Kumar",
      "dateOfBirth": "1990-01-15T00:00:00.000Z",
      "gender": "MALE",
      "maritalStatus": "NEVER_MARRIED",
      "religion": "HINDU",
      "motherTongue": "CHHATTISGARHI",
      "caste": "General",
      "country": "India",
      "state": "Chhattisgarh",
      "city": "Raipur",
      "height": 170,
      "speaksChhattisgarhi": true,
      "nativeDistrict": "Raipur",
      "bio": "About me..."
    }
    ```
  * **Success Response (201):** Returns the newly created `Profile` object.
  * **Error Responses:**
      * `409 Conflict`: "Profile already exists".

#### `GET /profiles/me`

  * **Purpose:** Gets the authenticated user's own full profile with all related data.
  * **Auth:** JWT (`authenticate`)
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "id": 1,
        "userId": 1,
        "firstName": "Ramesh",
        "age": 35,
        "media": [
          {
            "id": 1,
            "url": "/uploads/...",
            "thumbnailUrl": "/uploads/...",
            "type": "PROFILE_PHOTO",
            "isProfilePicture": true,
            "privacySettings": { ... }
          }
        ],
        "education": [ { ... } ],
        "occupations": [ { ... } ],
        ...
      },
      "message": "Profile retrieved successfully"
    }
    ```
  * **Special Notes:**
      * Calculates `age` from `dateOfBirth`.
      * Transforms the `media` list, mapping `isDefault` to `isProfilePicture` for frontend convenience.

#### `PUT /profiles/me`

  * **Purpose:** Updates the authenticated user's profile.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json`. Any optional field from the `Profile` model.
    ```json
    {
      "bio": "An updated bio.",
      "height": 172,
      "annualIncome": "5-10 LPA"
    }
    ```
  * **Success Response (200):** Returns the updated `Profile` object.
  * **Special Notes:** Automatically recalculates `profileCompleteness` after update.

#### `GET /profiles/search`

  * **Purpose:** Provides advanced, paginated search for profiles based on criteria.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Query Params:**
      * `page` (number, optional): Page number.
      * `limit` (number, optional): Results per page.
      * `gender` (enum, optional): `MALE`, `FEMALE`, `OTHER`.
      * `minAge` (number, optional): e.g., 25.
      * `maxAge` (number, optional): e.g., 30.
      * `religions` (string, optional): Comma-separated list, e.g., "HINDU,SIKH".
      * `castes` (string, optional): Comma-separated list, e.g., "General,OBC".
      * `maritalStatus` (enum, optional): `NEVER_MARRIED`, etc.
      * `minHeight` (number, optional): Height in cm, e.g., 150.
      * `maxHeight` (number, optional): Height in cm, e.g., 180.
      * `nativeDistrict` (string, optional): e.g., "Raipur".
      * `speaksChhattisgarhi` (boolean, optional): `true` or `false`.
  * **Success Response (200):** Returns a paginated list of matching profiles.
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "profiles": [
          {
            "id": 2,
            "firstName": "Priya",
            "age": 28,
            "city": "Bilaspur",
            "user": { "id": 2, "role": "PREMIUM_USER" },
            "media": [ { "isProfilePicture": true, ... } ]
            ...
          }
        ],
        "pagination": { ... }
      },
      "message": "Profiles retrieved successfully"
    }
    ```
  * **Special Notes:** Filters out blocked users and the user themselves. Only returns the default profile photo (`isDefault: true`) for each profile in the list.

#### `GET /profiles/:userId`

  * **Purpose:** Gets a specific user's full profile by their **User ID**.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Path Params:**
      * `userId` (number): The `User ID` of the profile to view.
  * **Success Response (200):** Returns the full `Profile` object, same format as `GET /profiles/me`.
  * **Error Responses:**
      * `404 Not Found`: If profile doesn't exist or is blocked.

#### `DELETE /profiles/photos/:mediaId`

  * **Purpose:** Deletes a specific photo from the user's profile.
  * **Auth:** JWT (`authenticate`)
  * **Path Params:**
      * `mediaId` (number): The ID of the `Media` item to delete.
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": null,
      "message": "Photo deleted successfully"
    }
    ```
  * **Special Notes:** This action deletes the file from AWS S3, the `Media` record from the DB, and the associated `PhotoPrivacySettings` record via cascade.

-----

### Education (`/education`)

*These routes manage the `Education` model linked to a user's profile.*

  * **Auth:** All routes require JWT (`authenticate`) + `requireCompleteProfile`.

#### `POST /education`

  * **Purpose:** Adds a new education entry to the user's profile.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "degree": "BACHELORS",
      "institution": "XYZ College",
      "field": "Computer Science",
      "yearOfPassing": 2020,
      "isCurrent": false
    }
    ```
  * **Success Response (201):** Returns the created `Education` object.

#### `GET /education`

  * **Purpose:** Gets all education entries for the authenticated user.
  * **Success Response (200):** Returns `ApiResponse` with `data: [Education, ...]`

#### `PUT /education/:id`

  * **Purpose:** Updates an existing education entry.
  * **Path Params:** `id` (number) - The ID of the education entry.
  * **Request Body Schema:** `application/json` (Same as `POST`, but all fields optional).
  * **Success Response (200):** Returns the updated `Education` object.

#### `DELETE /education/:id`

  * **Purpose:** Deletes an education entry.
  * **Path Params:** `id` (number) - The ID of the education entry.
  * **Success Response (200):** Returns `data: null`.

-----

### Occupation (`/occupation`)

*These routes manage the `Occupation` model linked to a user's profile.*

  * **Auth:** All routes require JWT (`authenticate`) + `requireCompleteProfile`.

#### `POST /occupation`

  * **Purpose:** Adds a new occupation/job entry to the user's profile.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "companyName": "Google",
      "designation": "Software Engineer",
      "employmentType": "SALARIED",
      "isCurrent": true,
      "startDate": "2022-01-01T00:00:00.000Z"
    }
    ```
  * **Success Response (201):** Returns the created `Occupation` object.

#### `GET /occupation`

  * **Purpose:** Gets all occupation entries for the authenticated user.
  * **Success Response (200):** Returns `ApiResponse` with `data: [Occupation, ...]`.

#### `PUT /occupation/:id`

  * **Purpose:** Updates an existing occupation entry.
  * **Path Params:** `id` (number) - The ID of the occupation entry.
  * **Request Body Schema:** `application/json` (Same as `POST`, all fields optional).
  * **Success Response (200):** Returns the updated `Occupation` object.

#### `DELETE /occupation/:id`

  * **Purpose:** Deletes an occupation entry.
  * **Path Params:** `id` (number) - The ID of the occupation entry.
  * **Success Response (200):** Returns `data: null`.

-----

### Partner Preferences (`/preference`)

  * **Auth:** All routes require JWT (`authenticate`) + `requireCompleteProfile`.

#### `GET /preference`

  * **Purpose:** Gets the authenticated user's partner preferences.
  * **Success Response (200):** Returns the `PartnerPreference` object, with JSON string fields parsed into arrays.
    ```json
    {
      "success": true,
      "data": {
        "id": 1,
        "profileId": 1,
        "ageFrom": 25,
        "ageTo": 30,
        "religion": ["HINDU"],
        "caste": ["General", "OBC"],
        "motherTongue": ["CHHATTISGARHI", "HINDI"],
        "mustSpeakChhattisgarhi": true,
        ...
      },
      ...
    }
    ```

#### `PUT /preference`

  * **Purpose:** Creates or updates (upserts) the user's partner preferences.
  * **Request Body Schema:** `application/json`
      * Fields like `religion`, `caste`, `motherTongue`, `maritalStatus`, `country`, `state`, `city`, `nativeDistrict`, `education`, `occupation`, `diet` can be sent as arrays of strings (e.g., `["HINDU", "SIKH"]`).
  * **Request Body Example:**
    ```json
    {
      "ageFrom": 26,
      "ageTo": 32,
      "heightFrom": 160,
      "religion": ["HINDU"],
      "mustSpeakChhattisgarhi": true
    }
    ```
  * **Success Response (200):** Returns the updated `PartnerPreference` object (with arrays parsed).

-----

### Social (`/shortlist`, `/block`, `/report`, `/view`)

  * **Auth:** All routes require JWT (`authenticate`) + `requireCompleteProfile`.

#### `POST /shortlist`

  * **Purpose:** Adds another user to the authenticated user's shortlist.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "shortlistedUserId": 2,
      "note": "Seems like a good match."
    }
    ```
  * **Success Response (201):** Returns the created `Shortlist` object.
  * **Error Responses:**
      * `400 Bad Request`: "You cannot shortlist yourself".
      * `404 Not Found`: "The user... does not exist".
      * `409 Conflict`: "This user is already in your shortlist".

#### `GET /shortlist`

  * **Purpose:** Gets the paginated list of users the authenticated user has shortlisted.
  * **Query Params:** `page` (number), `limit` (number).
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "profiles": [
          {
            "id": 2,
            "profilePicture": "...",
            "role": "USER",
            "profile": { "firstName": "Priya", ... },
            "shortlistNote": "Seems like a good match.",
            "shortlistedAt": "2025-11-17T...Z"
          }
        ],
        "pagination": { ... }
      },
      ...
    }
    ```

#### `DELETE /shortlist/:shortlistedUserId`

  * **Purpose:** Removes a user from the authenticated user's shortlist.
  * **Path Params:** `shortlistedUserId` (number).
  * **Success Response (200):** Returns `data: null`.

#### `POST /block`

  * **Purpose:** Blocks another user.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "blockedId": 2,
      "reason": "Spam"
    }
    ```
  * **Success Response (201):** Returns the created `BlockedUser` object.
  * **Special Notes:** This action also **atomically deletes** any existing `MatchRequest` and `Shortlist` entries between the two users, in both directions.

#### `GET /block`

  * **Purpose:** Gets the paginated list of users the authenticated user has blocked.
  * **Query Params:** `page` (number), `limit` (number).
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "profiles": [
          {
            "id": 2,
            "profilePicture": "...",
            "profile": { "firstName": "Priya", ... },
            "blockReason": "Spam",
            "blockedAt": "2025-11-17T...Z"
          }
        ],
        "pagination": { ... }
      },
      ...
    }
    ```

#### `DELETE /block/:blockedId`

  * **Purpose:** Unblocks a user.
  * **Path Params:** `blockedId` (number).
  * **Success Response (200):** Returns `data: null`.

#### `POST /report`

  * **Purpose:** Submits a report against another user.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "reportedUserId": 2,
      "reason": "FAKE_PROFILE",
      "description": "This profile is using stock photos.",
      "evidence": "[\"http://example.com/proof.jpg\"]"
    }
    ```
  * **Validation Rules:**
      * `reason` must be a valid `REPORT_REASON` enum (e.g., `FAKE_PROFILE`, `INAPPROPRIATE_CONTENT`, `HARASSMENT`, `SCAM`, `SPAM`, `OTHER`).
      * `description` is required, min 10 chars.
  * **Success Response (201):** Returns the created `Report` object.

#### `POST /view`

  * **Purpose:** Logs that the authenticated user has viewed another user's profile.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "profileId": 2,
      "isAnonymous": false
    }
    ```
  * **Success Response (201):** Returns the created `ProfileView` object.
  * **Special Notes:**
      * Does not log self-views.
      * Prevents spam: Only logs one view per 24-hour period per user pair.
      * If `isAnonymous` is `false`, this triggers a `PROFILE_VIEWED` notification to the other user.

#### `GET /view/who-viewed-me`

  * **Purpose:** Gets a paginated list of users who viewed the authenticated user's profile.
  * **Query Params:** `page` (number), `limit` (number).
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "profiles": [
          {
            "id": 2,
            "profilePicture": "...",
            "profile": { "firstName": "Priya", ... },
            "viewedAt": "2025-11-17T...Z"
          }
        ],
        "pagination": { ... }
      },
      ...
    }
    ```
  * **Special Notes:** Automatically filters out anonymous views and views from blocked users.

#### `GET /view/my-history`

  * **Purpose:** Gets a paginated list of profiles the authenticated user has viewed.
  * **Query Params:** `page` (number), `limit` (number).
  * **Success Response (200):** Similar to `GET /view/who-viewed-me`, but returns profiles the user *has viewed*.

-----

### Premium Requests (`/contact-request`, `/photo-request`)

#### `POST /contact-request`

  * **Purpose:** Requests access to a user's contact information (phone, email, etc.).
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile` + **`requireSubscription`**
  * **Request Body Schema:** `application/json`
    ```json
    {
      "profileId": 2,
      "requestType": "PHONE",
      "message": "I'd like to connect."
    }
    ```
  * **Validation Rules:**
      * `requestType` must be a `CONTACT_REQUEST_TYPE` enum: `PHONE`, `EMAIL`, `SOCIAL`.
  * **Success Response (201):** Returns the created `ContactRequest` object.
  * **Error Responses:**
      * `403 Forbidden`: "You must be a premium member...".
      * `403 Forbidden`: "This user does not accept phone requests" (if receiver has disabled this in privacy settings).

#### `GET /contact-request/sent`

  * **Purpose:** Gets paginated list of contact requests the user has sent.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Query Params:** `page`, `limit`, `status` (enum: `PENDING`, `APPROVED`, `REJECTED`).
  * **Success Response (200):** Paginated list of `ContactRequest` objects with the `profile` (receiver) populated.

#### `GET /contact-request/received`

  * **Purpose:** Gets paginated list of contact requests the user has received.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Query Params:** `page`, `limit`, `status`.
  * **Success Response (200):** Paginated list of `ContactRequest` objects with the `requester` populated.

#### `POST /contact-request/:id/respond`

  * **Purpose:** Approve or reject a received contact request.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Path Params:** `id` (number) - The ID of the `ContactRequest`.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "status": "APPROVED"
    }
    ```
  * **Validation Rules:**
      * `status` must be one of: `APPROVED`, `REJECTED`.
  * **Success Response (200):** Returns the updated `ContactRequest` object.
  * **Error Responses:**
      * `403 Forbidden`: "You are not authorized to respond to this request" (if not the receiver).
      * `400 Bad Request`: "This request has already been responded to".

#### `POST /photo-request`

  * **Purpose:** Requests access to view a specific private photo.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile` + **`requireSubscription`**
  * **Request Body Schema:** `application/json`
    ```json
    {
      "photoId": 12,
      "message": "I'd like to see this photo."
    }
    ```
  * **Validation Rules:**
      * `photoId` (number) is the ID of the `Media` item, not the user.
  * **Success Response (201):** Returns the created `PhotoViewRequest` object.
  * **Error Responses:**
      * `403 Forbidden`: "This user does not accept view requests for this photo".
      * `409 Conflict`: "You already have a pending request for this photo".

#### `GET /photo-request/sent`

  * **Purpose:** Gets paginated list of photo requests the user has sent.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Query Params:** `page`, `limit`, `status` (enum: `PENDING`, `APPROVED`, `REJECTED`).
  * **Success Response (200):** Paginated list of `PhotoViewRequest` objects with `profile` (receiver) and `photo` (media) populated.

#### `GET /photo-request/received`

  * **Purpose:** Gets paginated list of photo requests the user has received.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Query Params:** `page`, `limit`, `status`.
  * **Success Response (200):** Paginated list of `PhotoViewRequest` objects with `requester` and `photo` populated.

#### `POST /photo-request/:id/respond`

  * **Purpose:** Approve or reject a received photo request.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Path Params:** `id` (number) - The ID of the `PhotoViewRequest`.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "status": "APPROVED"
    }
    ```
  * **Validation Rules:**
      * `status` must be one of: `APPROVED`, `REJECTED`.
  * **Success Response (200):** Returns the updated `PhotoViewRequest` object.
  * **Special Notes:** If `APPROVED`, the request is granted a 7-day expiry (`validUntil`) and a notification is sent to the requester.

-----

### Matches (`/matches`)

  * **Auth:** All routes require JWT (`authenticate`) + `requireCompleteProfile`.

#### `POST /matches`

  * **Purpose:** Sends a match request to another user.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "receiverId": 2,
      "message": "Hi, I think we'd be a good match."
    }
    ```
  * **Validation Rules:**
      * `receiverId` is required.
      * `message` is optional (max 500 chars).
  * **Success Response (201):** Returns the created `MatchRequest` object.
  * **Error Responses:**
      * `400 Bad Request`: "Cannot send match request to yourself".
      * `403 Forbidden`: "You cannot interact with this user" (if blocked).
      * `409 Conflict`: "Match request already exists".

#### `GET /matches/sent`

  * **Purpose:** Gets a paginated list of match requests the user has sent.
  * **Query Params:** `page`, `limit`, `status` (enum: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `EXPIRED`).
  * **Success Response (200):** Paginated list of `MatchRequest` objects with the `receiver`'s public profile populated.

#### `GET /matches/received`

  * **Purpose:** Gets a paginated list of match requests the user has received.
  * **Query Params:** `page`, `limit`, `status`.
  * **Success Response (200):** Paginated list of `MatchRequest` objects with the `sender`'s public profile populated.

#### `GET /matches/accepted`

  * **Purpose:** Gets a paginated list of all *accepted* matches (connections).
  * **Query Params:** `page`, `limit`.
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "connections": [
          {
            "matchId": 5,
            "status": "ACCEPTED",
            "acceptedAt": "2025-11-17T...Z",
            "user": {
              "id": 2,
              "profilePicture": "...",
              "role": "USER",
              "profile": { "firstName": "Priya", ... }
            }
          }
        ],
        "pagination": { ... }
      },
      ...
    }
    ```
  * **Special Notes:** The response is formatted as `connections`, where `user` is always the *other* person in the match.

#### `POST /matches/:matchId/accept`

  * **Purpose:** Accepts a received match request.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Path Params:** `matchId` (number).
  * **Success Response (200):** Returns the updated `MatchRequest` object with `status: "ACCEPTED"`.
  * **Error Responses:**
      * `403 Forbidden`: "You can only accept match requests sent to you".
      * `400 Bad Request`: "Match request is not pending".

#### `POST /matches/:matchId/reject`

  * **Purpose:** Rejects a received match request.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Path Params:** `matchId` (number).
  * **Success Response (200):** Returns the updated `MatchRequest` object with `status: "REJECTED"`.

#### `DELETE /matches/:matchId`

  * **Purpose:** Deletes an accepted match (unmatch) or cancels a sent pending request.
  * **Auth:** JWT (`authenticate`) + `requireCompleteProfile`
  * **Path Params:** `matchId` (number).
  * **Success Response (200):** Returns `data: null`.
  * **Error Responses:**
      * `403 Forbidden`: "You can only delete your own matches".

-----

### Messages (`/messages`)

  * **Auth:** All routes require JWT (`authenticate`) + `requireCompleteProfile`.

#### `POST /messages`

  * **Purpose:** Sends a chat message to another user.
  * **Request Body Schema:** `application/json`
    ```json
    {
      "receiverId": 2,
      "content": "Hello! How are you?"
    }
    ```
  * **Success Response (201):** Returns the created `Message` object.
  * **Special Notes:** Also emits a `message:received` event via Socket.io to the `receiverId`.
  * **Error Responses:**
      * `403 Forbidden`: "You cannot send messages to this user" (if blocked).

#### `GET /messages/conversations`

  * **Purpose:** Gets a list of all chat conversations, ordered by the last message sent.
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": [
        {
          "user": {
            "id": 2,
            "profilePicture": "...",
            "profile": { "firstName": "Priya", "lastName": "Sharma" }
          },
          "lastMessage": {
            "id": 101,
            "content": "Hello!",
            "senderId": 1,
            "receiverId": 2,
            "isRead": true,
            "createdAt": "2025-11-17T...Z"
          },
          "unreadCount": 0,
          "lastMessageAt": "2025-11-17T...Z"
        }
      ],
      ...
    }
    ```
  * **Special Notes:** Automatically filters out conversations with blocked users.

#### `GET /messages/unread-count`

  * **Purpose:** Gets the total count of all unread messages from all conversations.
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": { "count": 5 },
      ...
    }
    ```
  * **Special Notes:** Automatically excludes counts from blocked users.

#### `GET /messages/:userId`

  * **Purpose:** Gets the paginated chat history with a specific user.
  * **Path Params:** `userId` (number) - The ID of the *other* user in the conversation.
  * **Query Params:** `page` (number), `limit` (number).
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "messages": [
          {
            "id": 101,
            "senderId": 1,
            "receiverId": 2,
            "content": "Hello!",
            "isRead": true,
            "createdAt": "2025-11-17T...Z",
            "sender": { ... }
          }
        ],
        "pagination": { ... }
      },
      ...
    }
    ```
  * **Error Responses:**
      * `403 Forbidden`: "You cannot view this conversation" (if blocked).

#### `PUT /messages/:userId/read`

  * **Purpose:** Marks all unread messages from a specific user as read.
  * **Path Params:** `userId` (number) - The ID of the *other* user whose messages you are reading.
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": { "count": 3 },
      "message": "Messages marked as read"
    }
    ```
  * **Special Notes:** Emits a `message:read` event via Socket.io to the `userId` so their UI can update.

#### `DELETE /messages/:messageId`

  * **Purpose:** Deletes a single message *that you sent*.
  * **Path Params:** `messageId` (number).
  * **Success Response (200):** Returns `data: null`.
  * **Special Notes:** This is a **soft delete**. The message content is replaced with "This message was deleted" and `isDeleted` is set to `true`. It is not removed from the receiver's view.
  * **Error Responses:**
      * `403 Forbidden`: "You can only delete your own messages".

-----

### Notifications (`/notifications`)

  * **Auth:** All routes require JWT (`authenticate`).

#### `GET /notifications`

  * **Purpose:** Gets a paginated list of the user's in-app notifications.
  * **Query Params:** `page`, `limit`.
  * **Success Response (200):** Paginated list of `Notification` objects.

#### `GET /notifications/unread-count`

  * **Purpose:** Gets the count of unread notifications.
  * **Success Response (200):** `data: { "count": 5 }`.

#### `PUT /notifications/read-all`

  * **Purpose:** Marks all of the user's notifications as read.
  * **Success Response (200):** `data: { "count": 5 }` (number of items updated).

#### `PUT /notifications/:notificationId/read`

  * **Purpose:** Marks a single notification as read.
  * **Path Params:** `notificationId` (number).
  * **Success Response (200):** Returns the updated `Notification` object.

#### `DELETE /notifications/:notificationId`

  * **Purpose:** Deletes a single notification.
  * **Path Params:** `notificationId` (number).
  * **Success Response (200):** Returns `data: null`.

#### `DELETE /notifications`

  * **Purpose:** Deletes *all* notifications for the user.
  * **Success Response (200):** `data: { "count": 10 }` (number of items deleted).

-----

### Payments (`/payments` & `/plans`)

#### `GET /plans`

  * **Purpose:** Gets the list of available, active subscription plans.
  * **Auth:** JWT (`authenticate`)
  * **Query Params:** `page`, `limit`.
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "plans": [
          {
            "id": 1,
            "name": "Premium 3 Months",
            "slug": "premium-3m",
            "nameEn": "Premium 3 Months",
            "nameHi": "प्रीमियम 3 महीने",
            "nameCg": "प्रीमियम 3 महीना",
            "price": "999.00",
            "currency": "INR",
            "duration": 90,
            "features": [
              "Send Unlimited Messages",
              "View Contact Details"
            ],
            ...
          }
        ],
        "pagination": { ... }
      },
      ...
    }
    ```
  * **Special Notes:** The `features` field is a JSON string in the DB but is parsed into an array by the service.

#### `POST /payments/orders`

  * **Purpose:** Creates a Razorpay payment order for a specific subscription plan.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json`
    ```json
    {
      "planId": 1
    }
    ```
  * **Success Response (201):** Returns the necessary details to initialize the Razorpay frontend checkout SDK.
    ```json
    {
      "success": true,
      "statusCode": 201,
      "data": {
        "orderId": "order_razorpay_id",
        "amount": 99900,
        "currency": "INR",
        "paymentId": 123,
        "key": "rzp_test_xxxxx"
      },
      "message": "Payment order created successfully"
    }
    ```
  * **Special Notes:**
      * `amount` is returned in **paise** (as required by Razorpay).
      * `key` is the Razorpay Key ID.
      * `paymentId` is the ID of the `Payment` record in our *local* DB.

#### `POST /payments/verify`

  * **Purpose:** Verifies a successful payment from the frontend Razorpay SDK.
  * **Auth:** JWT (`authenticate`)
  * **Request Body Schema:** `application/json`
    ```json
    {
      "razorpay_order_id": "order_id_from_razorpay",
      "razorpay_payment_id": "pay_id_from_razorpay",
      "razorpay_signature": "signature_from_razorpay"
    }
    ```
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "statusCode": 200,
      "data": {
        "success": true,
        "paymentId": "pay_id_from_razorpay"
      },
      "message": "Payment successful"
    }
    ```
  * **Special Notes:** This endpoint just verifies the signature for client-side feedback. The *actual* subscription activation happens via the webhook.

#### `POST /payments/webhook`

  * **Purpose:** **Webhook only.** Not for frontend use. This is the endpoint Razorpay calls to confirm payment capture.
  * **Auth:** None (uses `x-razorpay-signature` header for verification).
  * **Special Notes:** This endpoint is the **source of truth** for activating a user's subscription and upgrading their role to `PREMIUM_USER`.

#### `GET /payments/me`

  * **Purpose:** Gets the authenticated user's payment history.
  * **Auth:** JWT (`authenticate`)
  * **Success Response (200):** Returns `ApiResponse` with `data: [Payment, ...]`.

#### `GET /payments/:paymentId`

  * **Purpose:** Gets details for a single payment.
  * **Auth:** JWT (`authenticate`)
  * **Path Params:** `paymentId` (number).
  * **Success Response (200):** Returns `ApiResponse` with `data: Payment`.

-----

### Privacy & Settings (`/privacy`, `/settings`, `/photos`)

  * **Auth:** All routes require JWT (`authenticate`).
  * **Pattern:** All settings routes follow an "upsert" pattern. A `GET` request will return the current settings or create/return default settings if none exist. A `PUT` request will update the settings.

#### `GET /privacy/profile`

  * **Purpose:** Gets the user's `ProfilePrivacySettings`.
  * **Success Response (200):** Returns the `ProfilePrivacySettings` object.

#### `PUT /privacy/profile`

  * **Purpose:** Updates the user's `ProfilePrivacySettings`.
  * **Request Body Schema:** `application/json`. All fields from the `ProfilePrivacySettings` model are optional booleans or `PRIVACY_LEVEL` enums (`PUBLIC`, `REGISTERED`, `MATCHED`, `HIDDEN`).
  * **Success Response (200):** Returns the updated `ProfilePrivacySettings` object.

#### `GET /privacy/communication`

  * **Purpose:** Gets the user's `CommunicationPreferences`.
  * **Success Response (200):** Returns the `CommunicationPreferences` object (with JSON fields parsed to arrays).

#### `PUT /privacy/communication`

  * **Purpose:** Updates the user's `CommunicationPreferences`.
  * **Request Body Schema:** `application/json`. See `src/validation/privacy.validation.js`.
  * **Success Response (200):** Returns the updated `CommunicationPreferences` object.

#### `GET /privacy/search`

  * **Purpose:** Gets the user's `SearchVisibilitySettings`.
  * **Success Response (200):** Returns the `SearchVisibilitySettings` object.

#### `PUT /privacy/search`

  * **Purpose:** Updates the user's `SearchVisibilitySettings`.
  * **Request Body Schema:** `application/json`. See `src/validation/privacy.validation.js`.
  * **Success Response (200):** Returns the updated `SearchVisibilitySettings` object.

#### `GET /privacy/security`

  * **Purpose:** Gets the user's `AccountSecuritySettings`.
  * **Success Response (200):** Returns the *safe* `AccountSecuritySettings` object (sensitive fields like `twoFactorSecret` are omitted).

#### `PUT /privacy/security`

  * **Purpose:** Updates the user's `AccountSecuritySettings`.
  * **Request Body Schema:** `application/json`. See `src/validation/privacy.validation.js`.
  * **Success Response (200):** Returns the updated *safe* `AccountSecuritySettings` object.

#### `GET /settings/notifications`

  * **Purpose:** Gets the user's `NotificationPreferences`.
  * **Success Response (200):** Returns the `NotificationPreferences` object.

#### `PUT /settings/notifications`

  * **Purpose:** Updates the user's `NotificationPreferences`.
  * **Request Body Schema:** `application/json`. See `src/validation/notificationSettings.validation.js`.
  * **Success Response (200):** Returns the updated `NotificationPreferences` object.

#### `GET /photos/:mediaId/privacy`

  * **Purpose:** Gets the *per-photo* privacy settings (`PhotoPrivacySettings`) for a single photo.
  * **Path Params:** `mediaId` (number) - The ID of the `Media` item.
  * **Success Response (200):** Returns the `PhotoPrivacySettings` object.

#### `PUT /photos/:mediaId/privacy`

  * **Purpose:** Updates the *per-photo* privacy settings for a single photo.
  * **Path Params:** `mediaId` (number).
  * **Request Body Schema:** `application/json`.
    ```json
    {
      "visibility": "MATCHED",
      "enableWatermark": true,
      "blurLevel": "HIGH"
    }
    ```
  * **Validation Rules:**
      * `visibility`: `REGISTERED`, `MATCHED`, `HIDDEN`.
      * `watermarkPosition`: `BOTTOM_RIGHT`, `CENTER`, `TOP_LEFT`.
      * `blurLevel`: `LOW`, `MEDIUM`, `HIGH`.
  * **Success Response (200):** Returns the updated `PhotoPrivacySettings` object.

-----

### File Uploads (`/uploads`)

  * **Auth:** All routes require JWT (`authenticate`).
  * **Request Type:** `multipart/form-data`.

#### `POST /uploads/profile-photo`

  * **Purpose:** Uploads a single profile photo.
  * **Form-Data Field:** `photo`
  * **Validation:**
      * MIME Types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
      * Max Size: 5 MB
  * **Success Response (200):** Returns the created `Media` object.
    ```json
    {
      "success": true,
      "data": {
        "id": 1,
        "type": "PROFILE_PHOTO",
        "url": "https://s3.../photo.jpg",
        "thumbnailUrl": "https://s3.../thumb_photo.jpg",
        ...
      },
      ...
    }
    ```
  * **Special Notes:** The image is processed, resized (1200x1200), and a thumbnail (300x300) is generated before uploading to S3. A `PhotoPrivacySettings` record is created for it automatically.

#### `POST /uploads/profile-photos`

  * **Purpose:** Uploads multiple (up to 6) gallery photos.
  * **Form-Data Field:** `photos`
  * **Validation:**
      * MIME Types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
      * Max Size: 5 MB per file
      * Max Files: 6
  * **Success Response (200):** Returns an array of the created `Media` objects.
    ```json
    {
      "success": true,
      "data": [
        { "id": 2, "type": "GALLERY_PHOTO", ... },
        { "id": 3, "type": "GALLERY_PHOTO", ... }
      ],
      ...
    }
    ```

#### `POST /uploads/id-proof`

  * **Purpose:** Uploads a private ID proof document for verification.
  * **Form-Data Field:** `document`
  * **Validation:**
      * MIME Types: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`
      * Max Size: 10 MB
  * **Success Response (200):**
    ```json
    {
      "success": true,
      "data": {
        "message": "ID proof uploaded successfully and is pending verification.",
        "mediaId": 4
      },
      ...
    }
    ```
  * **Special Notes:** This file is uploaded as **private** to S3. Its `url` field in the `Media` table will be `null`. Access is only possible via admin or presigned URLs.

-----

### Admin (`/admin`)

  * **Auth:** All routes require JWT (`authenticate`) + `requireAdmin`.

  * **Note:** This is a summary. These routes are for admin panel use only.

  * `GET /admin/stats`: Get dashboard statistics.

  * `GET /admin/users`: Get paginated list of all users.

  * `GET /admin/users/recent`: Get recent signups.

  * `GET /admin/users/:userId`: Get a user's full details.

  * `PUT /admin/users/:userId/role`: Change a user's role.

  * `DELETE /admin/users/:userId`: Soft-delete a user.

  * `GET /admin/profiles`: Paginated search of all profiles (no block filters).

  * `GET /admin/matches/recent`: Get recent matches.

  * `GET /admin/reports`: Get paginated list of user-submitted reports.

  * `GET /admin/reports/:id`: Get a single report.

  * `PUT /admin/reports/:id`: Update a report's status (e.g., `RESOLVED`).

  * `POST /admin/cleanup/tokens`: Maintenance endpoint to delete expired refresh tokens.

  * `POST /admin/agents`: Create a new agent.

  * `GET /admin/agents`: Get all agents.

  * `GET /admin/agents/:agentId`: Get a single agent.

  * `PUT /admin/agents/:agentId`: Update an agent.

  * `DELETE /admin/agents/:agentId`: Soft-delete an agent.

## 3\. Authentication Guide

1.  **Login Step:** The frontend must use `expo-auth-session/providers/google` or a similar library to perform the Google OAuth flow. Configure it with the `webClientId` (`250704044564-q3ql66oruro0a17ipumla9cloda24tkk.apps.googleusercontent.com`) and `redirectUri` (`http://localhost:8080/auth/google/callback`).
2.  **Get Token:** On a successful Google login, the library will provide an `authentication.accessToken` (this is the `authorizationCode`).
3.  **Backend Login:** Send this code to `POST /api/v1/auth/google` as `authorizationCode`.
4.  **Store Tokens:** Securely store the `accessToken` and `refreshToken` received from the backend (e.g., using `@react-native-async-storage/async-storage`).
5.  **Use Token:** For all protected API calls, add the `accessToken` to the request header: `Authorization: Bearer <accessToken>`.
6.  **Refresh Token:**
      * The `accessToken` expires in **15 minutes**.
      * When an API request returns a `401 Unauthorized` error, or on app startup, call `POST /api/v1/auth/refresh` with the stored `refreshToken`.
      * Store the *new* `accessToken` and `refreshToken` returned from this call.
      * If the refresh fails (e.g., `refreshToken` expired after 7 days or was revoked), you must clear all stored tokens and navigate the user to the login screen.
7.  **Logout:** Call `POST /api/v1/auth/logout` (with the `refreshToken` in the body) to revoke the token on the server, then clear the tokens from local storage.
8.  **JWT Payload:** The `accessToken` payload contains: `{ "id": 1, "email": "user@example.com", "role": "USER", "type": "access", ... }`.

## 4\. Role & Permission Matrix

| Role | Access | Key Restrictions |
| :--- | :--- | :--- |
| **(No Auth)** | `GET /health`, `POST /auth/google`, `POST /auth/refresh`, `POST /payments/webhook` | Cannot access any user data. |
| **`USER`** (Authenticated) | Base access. Can create/edit own profile, manage settings. | **Cannot** search, match, message, or view other profiles until profile is complete. |
| **`USER` (Complete Profile)** | Can access social features: `GET /profiles/search`, `GET /profiles/:userId`, `POST /matches`, `POST /messages`, `POST /report`, `POST /block`, etc. | **Cannot** use premium features. |
| **`PREMIUM_USER`** (Complete + Subscribed) | All `USER` access + premium features. | Can `POST /contact-request` and `POST /photo-request`. |
| **`VERIFIED_USER`** | Role exists in schema but no specific logic is attached to it in middleware. Appears to be for admin/display purposes. | - |
| **`ADMIN`** | All user-level access + all routes under `POST /api/v1/admin`. | Can manage users, reports, and agents. |

## 5\. Error Handling Guide

All errors are returned in a standardized `ApiResponse` format.

**Standard Error Response Format:**

```json
{
  "statusCode": 4xx_or_5xx,
  "data": null,
  "message": "A human-readable error message",
  "success": false
}
```

### Common Error Examples

**422 Unprocessable Entity (Validation Error):**
*Note: The code specifies `ApiError(400, "Validation failed", errors)` in `validate.middleware.js`, but `error-handler.middleware.js` explicitly catches `ZodError` and returns `422`. `422` is the correct code to expect.*

```json
{
  "statusCode": 422,
  "data": null,
  "message": "Validation failed",
  "success": false,
  "errors": [
    {
      "field": "body.firstName",
      "message": "First name is required"
    },
    {
      "field": "body.phone",
      "message": "Invalid phone number format"
    }
  ]
}
```

**401 Unauthorized (Auth Error):**

```json
{
  "statusCode": 401,
  "data": null,
  "message": "Invalid or expired token",
  "success": false
}
```

**403 Forbidden (Permission Error):**

```json
{
  "statusCode": 403,
  "data": null,
  "message": "Please complete your profile to access this feature",
  "success": false,
  "data": {
    "profileCompleteness": 30,
    "requiredCompleteness": 50
  }
}
```

*or*

```json
{
  "statusCode": 403,
  "data": null,
  "message": "Active subscription required to access this feature",
  "success": false,
  "data": {
    "requiresSubscription": true
  }
}
```

**404 Not Found:**

```json
{
  "statusCode": 404,
  "data": null,
  "message": "Resource not found",
  "success": false
}
```

**409 Conflict (e.g., already exists):**

```json
{
  "statusCode": 409,
  "data": null,
  "message": "This user is already blocked",
  "success": false
}
```

**429 Too Many Requests (Rate Limit):**

```json
{
  "success": false,
  "message": "Too many OTP requests. Please try again after 15 minutes."
}
```

## 6\. File Upload Handling

  * **Auth:** All endpoints require JWT (`authenticate`).
  * **Format:** `multipart/form-data`.
  * **Processing:** All images are processed with `sharp` (resize, thumbnail) and uploaded to AWS S3 (if configured).

| Endpoint | Form Field | Max Files | Max Size | Allowed Mimetypes |
| :--- | :--- | :--- | :--- | :--- |
| `POST /uploads/profile-photo` | `photo` | 1 | 5 MB | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| `POST /uploads/profile-photos` | `photos` | 6 | 5 MB | `image/jpeg`, `image/jpg`, `image/png`, `image/webp` |
| `POST /uploads/id-proof` | `document` | 1 | 10 MB | `application/pdf`, `image/jpeg`, `image/jpg`, `image/png` |

*Source for all validation: `src/middleware/upload.js`*

**Success Response (e.g., `POST /uploads/profile-photo`):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "userId": 1,
    "profileId": 1,
    "type": "PROFILE_PHOTO",
    "url": "https://s3-bucket.../photo-1699.jpg",
    "thumbnailUrl": "https://s3-bucket.../thumb_photo-1699.jpg",
    "fileName": "photo-1699.jpg",
    "fileSize": 123456,
    "mimeType": "image/jpeg",
    "isDefault": true,
    "isVisible": true,
    ...
  },
  "message": "Profile photo uploaded successfully"
}
```

**Success Response (e.g., `POST /uploads/id-proof`):**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "message": "ID proof uploaded successfully and is pending verification.",
    "mediaId": 4
  },
  "message": "ID proof uploaded successfully"
}
```

## 7\. Realtime / WebSocket API

  * **Connect URL:** Use the same base URL as the API (e.g., `http://10.0.2.2:8080` for Android Emulator).
  * **Transport:** Must use `transports: ['websocket']`.
  * **Authentication:** The client **must** pass the `accessToken` on connection:
    ```javascript
    import io from 'socket.io-client';

    const socket = io(SOCKET_URL, {
      auth: {
        token: "your_access_token_here"
      },
      transports: ['websocket']
    });
    ```

### Events to Send (Client → Server)

| Event | Payload | Acknowledgment (Callback) |
| :--- | :--- | :--- |
| `join` | `(none)` | `(response) => { userId: 1, success: true }` |
| `message:send` | `{ receiverId: number, content: string }` | `(response) => { success: boolean, message: MessageObject }` |
| `message:read` | `{ userId: number }` (the *other* user's ID) | (None) |
| `typing:started` | `{ receiverId: number }` | (None) |
| `typing:stopped` | `{ receiverId: number }` | (None) |
| `notification:read` | `{ notificationId: number }` | `(response) => { success: boolean, notificationId: number }` |
| `notification:unread-count` | `(none)` | `(response) => { success: boolean, count: number }` |

### Events to Receive (Server → Client)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `connect` | `(none)` | Fired on successful connection. |
| `disconnect` | `(reason: string)` | Fired on disconnection. |
| `message:received` | `MessageObject` | A new chat message has been received. |
| `message:read` | `{ byUser: number }` | The other user has read your messages. |
| `notification:received` | `NotificationObject` | A new in-app notification (e.g., match, profile view). |
| `user:online` | `{ userId: number }` | A user has come online. |
| `user:offline` | `{ userId: number }` | A user has gone offline. |
| `typing:started` | `{ userId: number }` | The user in your chat has started typing. |
| `typing:stopped` | `{ userId: number }` | The user in your chat has stopped typing. |

## 8\. Frontend Integration Notes

  * **Android Emulator URL:** This is critical. For the Android Emulator, the API/Socket URL **must be `http://10.0.2.2:8080`**. `localhost` will not work.
  * **CORS:** `CORS_ORIGIN` is set to `*` in development, so no CORS issues are expected.
  * **Pagination:** The API uses `page` and `limit` query parameters. Responses are wrapped in a standard pagination object:
    ```json
    {
      "data": {
        "items": [ ... ],
        "pagination": {
          "currentPage": 1,
          "totalPages": 5,
          "totalItems": 50,
          "itemsPerPage": 10,
          "hasNextPage": true,
          "hasPrevPage": false
        }
      }
    }
    ```
  * **Date Formats:** All dates sent to the server (like `dateOfBirth`) **must be in ISO 8601 format** (`YYYY-MM-DDTHH:mm:ss.sssZ`).
  * **Blocked Users:** The backend provides `GET /api/v1/block` to fetch the block list. While the backend *does* filter most content, the frontend should *also* use this list to hide UI elements (e.g., "Message" button, profile in search) for a better user experience.
  * **Profile Completeness:** The `req.user.profile.profileCompleteness` (0-100) is returned on login/profile fetch. The frontend **must** prevent access to social features (Search, Match, Message) if this score is `< 50`. The backend will also block this with a `403 Forbidden` error.
  * **Key DTOs / Interfaces:** The frontend should create types/interfaces for:
      * `User` (with nested `Profile`)
      * `Profile` (a very large object, see `prisma/schema.prisma`)
      * `MatchRequest` (with nested `sender` or `receiver`)
      * `Message` (with nested `sender`)
      * `Notification`
      * `SubscriptionPlan`
      * All `Privacy` and `Settings` objects (e.g., `ProfilePrivacySettings`, `NotificationPreferences`).
  * **`isProfilePicture`:** When fetching a profile (`GET /profiles/me` or `GET /profiles/:userId`), the `media` array has a frontend-friendly boolean `isProfilePicture` which is mapped from the backend's `isDefault` field.