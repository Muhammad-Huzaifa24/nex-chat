import Pusher from 'pusher-js'

let pusherClient = null
const subscribedChannels = new Map()

/**
 * Get or create the Pusher client instance
 */
export const getPusher = () => {
  const pusherKey = import.meta.env.VITE_PUSHER_KEY
  const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2'

  if (!pusherKey) {
    return null
  }

  if (!pusherClient) {
    pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    })

    pusherClient.connection.bind('connected', () => {
      console.log('[Pusher Client] Connected successfully')
    })

    pusherClient.connection.bind('error', (err) => {
      console.warn('[Pusher Client Error]', err)
    })
  }

  return pusherClient
}

/**
 * Subscribe to a Pusher channel with deduplication
 */
export const subscribeChannel = (channelName) => {
  const pusher = getPusher()
  if (!pusher) return null

  if (subscribedChannels.has(channelName)) {
    return subscribedChannels.get(channelName)
  }

  const channel = pusher.subscribe(channelName)
  subscribedChannels.set(channelName, channel)
  return channel
}

/**
 * Unsubscribe from a Pusher channel
 */
export const unsubscribeChannel = (channelName) => {
  const pusher = getPusher()
  if (!pusher) return

  if (subscribedChannels.has(channelName)) {
    pusher.unsubscribe(channelName)
    subscribedChannels.delete(channelName)
  }
}
