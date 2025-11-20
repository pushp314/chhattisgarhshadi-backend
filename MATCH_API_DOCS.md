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
