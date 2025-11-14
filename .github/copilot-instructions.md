# Chhattisgarh Shadi Backend - AI Coding Instructions

## Architecture Overview

Matrimonial platform API for Chhattisgarh region: **Express.js + Prisma ORM + PostgreSQL**. Clean layered architecture: routes → controllers → services → database.

### Key Components
- **Authentication**: Google OAuth 2.0 ONLY (no passwords). Phone OTP is one-time verification, NOT for login
- **Real-time**: Socket.io with JWT handshake auth, user presence via `onlineUsers` Map, room-based emits (`io.to('user:X')`)
- **Storage**: Hybrid - S3 for production (`upload.service.js`), local filesystem fallback. Paths: `/uploads/profiles/{userId}/original/...`
- **Payments**: Razorpay only (no other gateways)
- **Notifications**: Multi-channel (SMS via MSG91, FCM push, in-app, email)
- **Multi-language**: `EN/HI/CG` enums throughout (User.preferredLanguage, Notification.language)

### Critical Database Patterns
- **User vs Profile separation**: User model = auth/security, Profile model = all user-facing data
- **Chhattisgarh-specific fields**: `nativeDistrict`, `speaksChhattisgarhi`, `nativeVillage` in Profile
- **Agent system**: Admin-created only, users link via `agentCodeUsed`, commissions auto-calculated
- **Soft deletes**: Always check `deletedAt: null`, never hard delete user data
- **Active/banned checks**: Filter with `isActive: true, isBanned: false, deletedAt: null`

## Development Workflow

### Server & Database
```bash
npm run dev                  # Development (nodemon auto-reload)
npm start                    # Production
npm run prisma:studio        # Database GUI browser
npm run prisma:generate      # Regenerate client after schema changes
npm run prisma:migrate       # Create/apply migration
```

### API Route Structure
All routes are mounted at `/api/v1` prefix (see `src/app.js`):
- Auth: `POST /api/v1/auth/google`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`
- Users: `/api/v1/users/*`
- Profiles: `/api/v1/profiles/*`
- Matches: `/api/v1/matches/*`
- Messages: `/api/v1/messages/*`
- Health: `GET /api/v1/health`

### Critical Environment Variables
Minimum for local dev (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - Min 32 chars each
- `GOOGLE_CLIENT_ID` - For mobile/frontend Google Sign-In verification
- `GOOGLE_CLIENT_SECRET` - Optional (only if using auth code flow)
- `CORS_ORIGIN` - Frontend URL(s), comma-separated or `*`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - Required (S3 or set to dummy values)
- `MSG91_AUTH_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` - Required

**Note**: Mobile OAuth flow means frontend handles Google OAuth UI and sends tokens to backend at `/api/v1/auth/google`

### Testing Auth Flow
**Mobile/Frontend Flow** (current implementation):
1. Frontend obtains Google authorization code or ID token
2. Send POST request to `http://localhost:8080/api/v1/auth/google`:
   ```json
   {
     "authorizationCode": "GOOGLE_AUTH_CODE",
     "redirectUri": "com.chhattisgarhshaadi.app://oauth2redirect"
   }
   ```
3. Extract `accessToken` from response
4. Use in API requests: `Authorization: Bearer {accessToken}`

**Note**: Backend uses mobile OAuth flow, not web redirect flow. All routes are under `/api/v1` prefix.

## Coding Conventions

### Error Handling Pattern
Always use `asyncHandler` from `src/utils/asyncHandler.js` to wrap async route handlers:
```javascript
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  // Your code - errors auto-caught
});
```

Throw errors using `ApiError` class from `src/utils/ApiError.js`:
```javascript
import { ApiError } from '../utils/ApiError.js';
import { HTTP_STATUS } from '../utils/constants.js';

throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Profile not found');
```

### Authentication Middleware Chain
Located in `src/middleware/auth.js`:
- `authenticate` - Basic JWT auth (requires valid token)
- `requireCompleteProfile` - Checks profile exists and ≥50% complete
- `requirePhoneVerified` - Ensures phone verification done
- `requireSubscription` - Checks active subscription
- `requireAdmin` - Admin/SuperAdmin role check

**Always** chain auth middleware before protected routes:
```javascript
router.get('/matches', authenticate, requireCompleteProfile, getMatches);
```

### Validation with Zod
All validation schemas in `src/validation/*.validation.js`. Zod parses `req.body`, `req.query`, `req.params`:
```javascript
import { z } from 'zod';
import { GENDER, RELIGION } from '../utils/constants.js';

export const createProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    gender: z.nativeEnum(GENDER),  // Always use enums from constants
    religion: z.nativeEnum(RELIGION),
  }).strict(),  // .strict() rejects extra fields
});
```

Apply with `validate` middleware from `src/middleware/validate.middleware.js`:
```javascript
import { validate } from '../middleware/validate.middleware.js';
import { createProfileSchema } from '../validation/profile.validation.js';

router.post('/profiles', authenticate, validate(createProfileSchema), createProfile);
```

### Constants Usage
Import enums from `src/utils/constants.js` - never use magic strings:
```javascript
import { LANGUAGE, MEDIA_TYPES, SOCKET_EVENTS } from '../utils/constants.js';

// Good
notification.language = LANGUAGE.HI;
media.type = MEDIA_TYPES.PROFILE_PHOTO;

// Bad
notification.language = 'HI';  // Don't hardcode
```

### Prisma Query Patterns
- Always use `prisma` from `src/config/database.js`
- Soft deletes: Add `deletedAt: null` to WHERE clauses
- Always include related data needed: `include: { profile: true, agent: true }`
- For user queries, check `isActive: true, isBanned: false`
```javascript
import prisma from '../config/database.js';

const user = await prisma.user.findUnique({
  where: { id: userId, isActive: true, isBanned: false, deletedAt: null },
  include: { profile: true },  // Include related data
});
```

### File Upload Flow
Uses **multer with memory storage** → **S3 or local filesystem**:
1. Middleware: `uploadProfilePhoto` or `uploadProfilePhotos` from `src/middleware/upload.js`
2. Service: `upload.service.js` handles S3 upload OR local file save with Sharp (resize, compress)
3. Store paths: S3 keys or `/uploads/profiles/{userId}/original/photo-{timestamp}.jpg`
4. Save metadata to `media` table with `MediaType` enum (from `constants.js`)
5. **CRITICAL**: Check if S3 is configured via `AWS_S3_BUCKET` env var to determine storage backend

### Socket.io Real-time
Socket handler in `src/socket/index.js`:
- Authentication via JWT token in handshake (`socket.handshake.auth.token` or `socket.handshake.query.token`)
- User presence tracking via `onlineUsers` Map (handles multiple connections per user)
- Always emit to rooms: `io.to(\`user:\${userId}\`).emit(event, data)` (NOT directly to `socket.id`)
- Socket events defined in `SOCKET_EVENTS` constant (MESSAGE_RECEIVED, USER_ONLINE, etc.)

Key patterns:
```javascript
// Emit to specific user (handles multiple devices)
io.to(`user:${receiverId}`).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, message);

// Check online status (from socket/index.js)
import { isUserOnline, getSocketIoInstance } from '../socket/index.js';
const online = isUserOnline(userId);
const io = getSocketIoInstance();
```

## Project-Specific Features

### Language Support
- Every notification/content has `language` field (EN/HI/CG enum)
- Users have `preferredLanguage` in User model
- Subscription plans have multi-language names: `nameEn`, `nameHi`, `nameCg`
- Always respect user's `preferredLanguage` when sending communications

### Chhattisgarh Regional Features
When working on profile/search features, prioritize these fields:
- `nativeDistrict` - Native Chhattisgarh district
- `speaksChhattisgarhi` - Boolean flag for language
- `nativeTehsil`, `nativeVillage` - Granular location
- Partner preferences include `mustSpeakChhattisgarhi` filter

### Privacy & Settings
Complex privacy system with 6+ settings models:
- `ProfilePrivacySettings` - What profile fields are visible
- `CommunicationPreferences` - Who can contact user
- `SearchVisibilitySettings` - Search/incognito controls
- `PhotoPrivacySettings` - Per-photo watermark/blur controls
- `NotificationPreferences` - Channel preferences (SMS/Email/Push/In-app)

When adding features affecting user data, check relevant privacy settings first.

### Agent Commission System
Agents are **admin-created only** (not self-service):
- Users link to agents via `agentCodeUsed` field during registration
- `AgentCommission` records auto-created on user subscriptions
- Payouts managed in batches via `AgentPayout`
- All agent actions logged in `AgentActivityLog`

## Testing & Debugging

### Logs
Winston logger at `src/config/logger.js`:
- Dev: Console + `logs/combined.log`
- Production: File-based with rotation
- Always log important actions: `logger.info('User logged in:', userId)`

### Testing API Endpoints
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Test auth (requires Google token from frontend)
curl -X POST http://localhost:8080/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"authorizationCode": "YOUR_GOOGLE_AUTH_CODE"}'

# Use access token in subsequent requests
curl http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Common Issues
- **Prisma Client outdated**: Run `npm run prisma:generate`
- **Migration issues**: Check `prisma/migrations/` and verify Postgres connection
- **Socket auth fails**: Ensure token passed in `auth.token` or `query.token` on handshake
- **File upload errors**: Check if S3 configured OR `uploads/` directory exists with write permissions

## DO NOT
- ❌ Add password authentication (Google OAuth only)
- ❌ Use phone/OTP for login (only for one-time verification)
- ❌ Hard-delete user data (always soft delete with `deletedAt`)
- ❌ Skip authentication middleware on protected routes
- ❌ Use magic strings instead of constants
- ❌ Modify `profileCompleteness`, `isVerified` in user-facing APIs (admin only)
- ❌ Emit socket events to single `socket.id` (use rooms: `io.to('user:X')`)

## Key Files Reference
- `prisma/schema.prisma` - Complete database schema with all enums
- `src/utils/constants.js` - All enums, status codes, messages
- `src/middleware/auth.js` - Authentication middleware chain
- `src/socket/index.js` - Real-time messaging setup
- `src/utils/asyncHandler.js` - Error handling wrapper
- `src/validation/*.validation.js` - Zod schemas for each domain
