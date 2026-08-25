import Pusher from 'pusher'
import dotenv from 'dotenv'

dotenv.config()

let pusher = null

if (
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_KEY &&
  process.env.PUSHER_SECRET &&
  process.env.PUSHER_CLUSTER
) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID.trim(),
    key: process.env.PUSHER_KEY.trim(),
    secret: process.env.PUSHER_SECRET.trim(),
    cluster: process.env.PUSHER_CLUSTER.trim(),
    useTLS: true,
  })
}

/**
 * Triggers a realtime event via Pusher
 * @param {string|string[]} channels - Single channel or array of channels
 * @param {string} event - Event name
 * @param {object} data - Event payload
 */
export const triggerPusherEvent = async (channels, event, data) => {
  if (!pusher) {
    // Graceful no-op if Pusher credentials are not provided
    return
  }

  try {
    await pusher.trigger(channels, event, data)
  } catch (error) {
    console.error(`[Pusher Trigger Error] Failed to send event ${event}:`, error.message)
  }
}

export default pusher
