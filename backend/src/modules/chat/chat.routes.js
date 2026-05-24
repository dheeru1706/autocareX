const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth');
const chatController = require('./chat.controller');

router.use(verifyToken);

router.get('/', chatController.getConversations);
router.get('/:bookingId', chatController.getOrCreateConversation);
router.get('/:conversationId/messages', chatController.getMessages);
router.post('/:conversationId/messages', chatController.sendMessage);
router.patch('/:conversationId/read', chatController.markAsRead);

module.exports = router;
