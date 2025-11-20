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
