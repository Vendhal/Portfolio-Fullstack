// Service Worker for Portfolio PWA
// Version 1.0.0

const CACHE_NAME = 'portfolio-pwa-v1.0.0'
const OFFLINE_URL = '/offline.html'

// Resources to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  // Add critical CSS and JS files (these will be updated dynamically)
]

// Dynamic cache names
const CACHES = {
  static: `${CACHE_NAME}-static`,
  dynamic: `${CACHE_NAME}-dynamic`,
  images: `${CACHE_NAME}-images`,
  api: `${CACHE_NAME}-api`
}

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHES.static)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Service Worker: Installation completed')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old cache versions
            if (cacheName.startsWith('portfolio-pwa-') && cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation completed')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle network requests with cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Handle different types of requests with appropriate strategies
  if (url.origin === location.origin) {
    // Same-origin requests
    if (request.url.includes('/api/')) {
      // API requests - Network First with cache fallback
      event.respondWith(handleApiRequest(request))
    } else if (request.destination === 'image') {
      // Images - Cache First with network fallback
      event.respondWith(handleImageRequest(request))
    } else {
      // HTML, CSS, JS - Stale While Revalidate
      event.respondWith(handleStaticRequest(request))
    }
  } else {
    // External requests (CDNs, external APIs)
    event.respondWith(handleExternalRequest(request))
  }
})

// Network First strategy for API requests
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful API responses for offline access
      const cache = await caches.open(CACHES.api)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: API request failed, trying cache', error)
    
    // Try to get from cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        message: 'This feature requires an internet connection',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

// Cache First strategy for images
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.images)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Image request failed', error)
    
    // Return placeholder image for failed image requests
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1a1a1a"/><text x="50%" y="50%" text-anchor="middle" fill="#666" font-family="Arial" font-size="18">Image Unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

// Stale While Revalidate for static resources
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          const cache = caches.open(CACHES.dynamic)
          cache.then(c => c.put(request, networkResponse))
        }
      })
      .catch(() => {
        // Network failed, but we already have cached version
      })
    
    return cachedResponse
  }
  
  // No cached version, try network
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHES.dynamic)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Static request failed', error)
    
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL)
      return offlineResponse || new Response('Offline', { status: 503 })
    }
    
    // For other requests, return appropriate fallback
    return new Response('Resource unavailable offline', { status: 503 })
  }
}

// External requests - try network with timeout
async function handleExternalRequest(request) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return networkResponse
  } catch (error) {
    console.log('Service Worker: External request failed', error)
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('External resource unavailable', { status: 503 })
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms())
  }
  
  if (event.tag === 'profile-update-sync') {
    event.waitUntil(syncProfileUpdates())
  }
})

// Sync offline contact form submissions
async function syncContactForms() {
  try {
    const cache = await caches.open(CACHES.api)
    const cachedRequests = await cache.keys()
    
    for (const request of cachedRequests) {
      if (request.url.includes('/api/contact') && request.method === 'POST') {
        try {
          const response = await fetch(request.clone())
          if (response.ok) {
            await cache.delete(request)
            console.log('Service Worker: Synced contact form submission')
          }
        } catch (error) {
          console.log('Service Worker: Failed to sync contact form', error)
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Contact form sync failed', error)
  }
}

// Sync offline profile updates
async function syncProfileUpdates() {
  try {
    console.log('Service Worker: Syncing profile updates...')
    // Implementation for syncing profile updates when back online
  } catch (error) {
    console.error('Service Worker: Profile update sync failed', error)
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: 'Check out the latest updates to our portfolio!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Updates',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: false,
    tag: 'portfolio-update'
  }
  
  if (event.data) {
    try {
      const payload = event.data.json()
      options.body = payload.body || options.body
      options.data.url = payload.url || options.data.url
      options.tag = payload.tag || options.tag
    } catch (error) {
      console.log('Service Worker: Failed to parse push data', error)
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Portfolio Update', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action)
  
  event.notification.close()
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Try to focus existing window
          for (const client of clientList) {
            if (client.url.includes(url) && 'focus' in client) {
              return client.focus()
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(url)
          }
        })
    )
  }
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed')
  
  // Track notification dismissal analytics here
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHES.dynamic)
        .then((cache) => cache.addAll(event.data.urls))
    )
  }
})