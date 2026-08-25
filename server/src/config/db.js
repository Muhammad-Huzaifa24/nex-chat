import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexchat')
    console.log(`[MongoDB] Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`[MongoDB Error] ${error.message}`)
    // Continue running even if local Mongo is not up yet, to allow API testing
  }
}
