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
