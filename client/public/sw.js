// NexChat Service Worker for Background Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl)
          }
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})

// Background Push Event Handler (W3C Web Push wakes up Service Worker when tab is frozen/closed)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'NexChat',
    body: 'You have a new message',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/',
  }

  if (event.data) {
    try {
      const json = event.data.json()
      payload = { ...payload, ...json }
    } catch {
      payload.body = event.data.text()
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/',
      conversationId: payload.conversationId,
    },
    tag: payload.tag || `nexchat-${payload.conversationId || 'msg'}`,
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})
