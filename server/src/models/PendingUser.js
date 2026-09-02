import mongoose from 'mongoose'

const pendingUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    // Password is pre-hashed with bcrypt before storing here
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    // TTL field — MongoDB auto-deletes document 10 minutes after creation
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Do NOT use Mongoose timestamps here; we manage createdAt manually for TTL
    timestamps: false,
  }
)

// MongoDB TTL index: auto-purge unverified pending registrations after 10 minutes
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 })

// Unique indexes to prevent duplicate pending registrations
pendingUserSchema.index({ email: 1 }, { unique: true })
pendingUserSchema.index({ username: 1 }, { unique: true })

const PendingUser = mongoose.model('PendingUser', pendingUserSchema)
export default PendingUser
