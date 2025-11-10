import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authenticate, requireCompleteProfile } from '../middleware/auth.js';

const router = Router();

// All routes require authentication and complete profile
router.use(authenticate, requireCompleteProfile);

/**
 * @route   POST /api/messages
 * @desc    Send message
 * @access  Private
 */
router.post('/', messageController.sendMessage);

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
router.get('/:userId', messageController.getConversation);

/**
 * @route   PUT /api/messages/:userId/read
 * @desc    Mark messages as read
 * @access  Private
 */
router.put('/:userId/read', messageController.markMessagesAsRead);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete message
 * @access  Private
 */
router.delete('/:messageId', messageController.deleteMessage);

export default router;
