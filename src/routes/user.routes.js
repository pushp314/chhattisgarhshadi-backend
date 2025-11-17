import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  objectIdSchema,
  updateMeSchema,
  searchUsersSchema,
  registerFcmTokenSchema, // ADDED
} from '../validation/user.validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/users/me:
 * get:
 * summary: Get current user profile
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: User profile retrieved successfully
 */
router.get('/me', userController.getMyProfile);

/**
 * @swagger
 * /api/v1/users/me:
 * put:
 * summary: Update current user
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * preferredLanguage:
 * type: string
 * enum: [EN, HI, CG]
 * responses:
 * 200:
 * description: User updated successfully
 */
router.put('/me', validate(updateMeSchema), userController.updateMe);

/**
 * @swagger
 * /api/v1/users/me:
 * delete:
 * summary: Delete current user account (Soft Delete)
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Account deleted successfully
 */
router.delete('/me', userController.deleteMe);

/**
 * @swagger
 * /api/v1/users/fcm-token:
 * post:
 * summary: Register or update FCM token
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * token:
 * type: string
 * deviceId:
 * type: string
 * deviceType:
 * type: string
 * enum: [IOS, ANDROID, WEB]
 * deviceName:
 * type: string
 * responses:
 * 200:
 * description: FCM token registered successfully
 */
router.post(
  '/fcm-token', // ADDED
  validate(registerFcmTokenSchema),
  userController.registerFcmToken
);

/**
 * @swagger
 * /api/v1/users/search:
 * get:
 * summary: Search users
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: query
 * name: query
 * schema:
 * type: string
 * - in: query
 * name: page
 * schema:
 * type: integer
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * responses:
 * 200:
 * description: Users retrieved successfully
 */
router.get('/search', validate(searchUsersSchema), userController.searchUsers);

/**
 * @swagger
 * /api/v1/users/{id}:
 * get:
 * summary: Get user by ID
 * tags: [Users]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: User retrieved successfully
 */
router.get('/:id', validate(objectIdSchema), userController.getUserById);

export default router;