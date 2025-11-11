import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';
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

/**
 * @route   POST /api/messages
 * @desc    Send message
 * @access  Private
 */
router.post('/', validate(sendMessageSchema), messageController.sendMessage);

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations
 * @access  Private
 */
router.get('/conversations', messageController.getAllConversations);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', messageController.getUnreadCount);

/**
 * @route   GET /api/messages/:userId
 * @desc    Get conversation with a user
 * @access  Private
 */
router.get(
  '/:userId',
  validate(conversationParamsSchema.merge(conversationQuerySchema)),
  messageController.getConversation
);

/**
 * @route   PUT /api/messages/:userId/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put(
  '/:userId/read',
  validate(conversationParamsSchema),
  messageController.markMessagesAsRead
);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete message
 * @access  Private
 */
router.delete(
  '/:messageId',
  validate(messageIdParamSchema),
  messageController.deleteMessage
);

export default router;