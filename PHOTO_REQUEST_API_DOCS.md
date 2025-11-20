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
