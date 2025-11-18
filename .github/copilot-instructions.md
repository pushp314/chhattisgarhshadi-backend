# AI Coding Agent Instructions for Chhattisgarh Shaadi Backend

This document provides essential guidelines for contributing to this project. Following these patterns will ensure consistency and leverage the existing architecture.

## 1. Core Technology Stack

- **Framework**: Node.js with Express.
- **Database ORM**: Prisma.
- **Authentication**: JWT-based with Google Sign-In support.
- **Validation**: Zod for request data validation.

## 2. Project Structure

The application follows a service-oriented architecture. Please adhere to this separation of concerns:

- `src/controllers`: Handle incoming HTTP requests, call service-layer functions, and send back responses. Controllers should not contain direct database queries or complex business logic.
- `src/services`: Contain all business logic. This is where you interact with the database via Prisma and implement the core features.
- `src/routes`: Define all API endpoints and link them to controller functions. They also apply necessary middleware (e.g., authentication, validation).
- `src/validation`: Contain all Zod schemas for validating request bodies, query parameters, etc.
- `src/middleware`: Holds all Express middleware, such as the global error handler and authentication checks.
- `src/config`: For application configuration, including the Prisma client initialization.

## 3. Database Interactions with Prisma

All database operations must go through the Prisma client.

- **Prisma Client**: A singleton Prisma client is initialized and exported from `src/config/prisma.js`. Always import it for use in service files:
  ```javascript
  import { prisma } from "@/config/prisma";
  ```

- **Creating Records**: Use Prisma's declarative API to create new database entries. The following example creates a new user:
  ```javascript
  // From: src/services/auth.service.js
  const newUser = await prisma.user.create({
    data: {
      email: 'user@example.com',
      googleId: 'some-google-id',
      authProvider: 'GOOGLE',
      // ... other fields
    },
  });
  ```

- **Transactions**: For operations that must succeed or fail together, use `prisma.$transaction`. This ensures atomicity.
  ```javascript
  // From: src/services/auth.service.js
  await prisma.$transaction([
    prisma.phoneVerification.deleteMany({ where: { userId } }),
    prisma.phoneVerification.create({ data: { /* ... */ } })
  ]);
  ```

## 4. Error Handling

- Use the custom `ApiError` class from `src/utils/ApiError.js` for throwing expected errors within services.
- All routes are wrapped in an `asyncHandler` utility that catches errors and passes them to the central error-handling middleware (`src/middleware/error-handler.middleware.js`). You do not need to write `try...catch` blocks in controllers.

## 5. Local Development Commands

Use the following npm scripts for common development tasks:

- `npm run dev`: Starts the server in development mode with Nodemon for auto-reloading.
- `npm run prisma:migrate`: Applies new database migrations.
- `npm run prisma:generate`: Generates the Prisma Client based on the schema.
