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
