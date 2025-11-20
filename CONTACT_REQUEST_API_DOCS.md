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
