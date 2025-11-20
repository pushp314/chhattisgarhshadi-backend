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
