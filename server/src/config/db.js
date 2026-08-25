import mongoose from 'mongoose'

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexchat'
    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      console.log(`[MongoDB] Connected: ${mongooseInstance.connection.host}`)
      return mongooseInstance
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    cached.promise = null
    console.error(`[MongoDB Error] ${error.message}`)
    throw error
  }

  return cached.conn
}
