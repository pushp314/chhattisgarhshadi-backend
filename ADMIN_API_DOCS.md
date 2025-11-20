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
