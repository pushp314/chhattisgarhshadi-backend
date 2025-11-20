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
