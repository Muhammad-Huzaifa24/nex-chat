import express from 'express'
import {
  getOrCreateDirect,
  getUserConversations,
  createGroup,
  updateGroup,
  addGroupMember,
  removeGroupMember,
  leaveGroup,
  hideConversation,
} from '../controllers/conversationController.js'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/', getUserConversations)
router.post('/direct', getOrCreateDirect)
router.post('/group', upload.single('groupAvatar'), createGroup)
router.put('/group/:id', upload.single('groupAvatar'), updateGroup)
router.post('/group/:id/members', addGroupMember)
router.delete('/group/:id/members/:userId', removeGroupMember)
router.post('/group/:id/leave', leaveGroup)
router.delete('/:id', hideConversation)

export default router
