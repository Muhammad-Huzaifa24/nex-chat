import express from 'express'
import {
  searchUsers,
  getUserById,
  updateProfile,
  updateAvatar,
  deleteAvatar,
  heartbeat,
  setOffline,
  getPublicProfile,
} from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

// Public route to view a user profile by username
router.get('/profile/:username', getPublicProfile)

// Protected routes
router.use(protect)

router.get('/search', searchUsers)
router.post('/heartbeat', heartbeat)
router.post('/offline', setOffline)
router.get('/:id', getUserById)
router.put('/profile', updateProfile)
router.put('/avatar', upload.single('avatar'), updateAvatar)
router.delete('/avatar', deleteAvatar)

export default router

