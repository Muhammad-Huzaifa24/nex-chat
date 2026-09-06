import express from 'express'
import {
  getMessages,
  sendMessage,
  deleteMessage,
  reactToMessage,
  markMessagesAsRead,
  sendTypingStatus,
  markMessageAsDelivered,
  markConversationMessagesAsDelivered,
} from '../controllers/messageController.js'
import { getLinkPreview } from '../controllers/linkPreviewController.js'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/link-preview', getLinkPreview)
router.get('/:conversationId', getMessages)
router.post('/', upload.single('file'), sendMessage)
router.delete('/:id', deleteMessage)
router.post('/:id/react', reactToMessage)
router.put('/read/:conversationId', markMessagesAsRead)
router.put('/deliver/:messageId', markMessageAsDelivered)
router.put('/deliver-all/:conversationId', markConversationMessagesAsDelivered)
router.post('/typing', sendTypingStatus)

export default router
