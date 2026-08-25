import express from 'express'
import { searchUsers, getUserById, updateProfile, updateAvatar } from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'
import { upload } from '../middleware/uploadMiddleware.js'

const router = express.Router()

router.use(protect)

router.get('/search', searchUsers)
router.get('/:id', getUserById)
router.put('/profile', updateProfile)
router.put('/avatar', upload.single('avatar'), updateAvatar)

export default router
