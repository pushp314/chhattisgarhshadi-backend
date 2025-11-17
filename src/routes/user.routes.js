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

router.get('/me', userController.getMyProfile);
router.put('/me', validate(updateMeSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);

router.post(
  '/fcm-token', // ADDED
  validate(registerFcmTokenSchema),
  userController.registerFcmToken
);


router.get('/search', validate(searchUsersSchema), userController.searchUsers);


router.get('/:id', validate(objectIdSchema), userController.getUserById);

export default router;