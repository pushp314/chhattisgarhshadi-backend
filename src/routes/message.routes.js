import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authenticate, requireCompleteProfile, requireSubscription } from '../middleware/auth.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  sendMessageSchema,
  conversationParamsSchema,
  conversationQuerySchema,
  messageIdParamSchema,
} from '../validation/message.validation.js';

const router = Router();

// All routes require authentication and a complete profile
router.use(authenticate, requireCompleteProfile);

// Sending messages requires PREMIUM subscription
router.post('/', requireSubscription, validate(sendMessageSchema), messageController.sendMessage);


router.get('/conversations', messageController.getAllConversations);


router.get('/unread-count', messageController.getUnreadCount);


router.get(
  '/:userId',
  validate(conversationParamsSchema.merge(conversationQuerySchema)),
  messageController.getConversation
);

router.put(
  '/:userId/read',
  validate(conversationParamsSchema),
  messageController.markMessagesAsRead
);


router.delete(
  '/:messageId',
  validate(messageIdParamSchema),
  messageController.deleteMessage
);

export default router;