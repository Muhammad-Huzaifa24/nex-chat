import { verifyToken } from '../utils/jwt.js'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  let token = null

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' })
  }

  try {
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.id).select('-password')
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or token invalid' })
    }
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token verification failed', error: error.message })
  }
}
