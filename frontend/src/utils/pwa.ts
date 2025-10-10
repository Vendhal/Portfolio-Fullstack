// PWA utilities for service worker registration and push notifications
import type { PushNotificationPayload } from '../types/index'

class PWAManager {
  private static instance: PWAManager | null = null
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false
  private deferredPrompt: any = null
  private callbacks: Map<string, Function[]> = new Map()

  static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager()
    }
    return PWAManager.instance
  }

  private constructor() {
    this.initializePWA()
  }

  private async initializePWA(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker()
        this.setupInstallPrompt()
        this.setupPeriodicSync()
      } catch (error) {
        console.error('PWA initialization failed:', error)
        this.emit('error', 'Failed to initialize PWA features')
      }
    }
  }

  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      this.registration = registration
      console.log('Service Worker registered successfully:', registration.scope)

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          this.handleServiceWorkerUpdate(newWorker)
        }
      })

      // Check for existing service worker updates
      if (registration.waiting) {
        this.updateAvailable = true
        this.emit('updateAvailable', 'A new version is available', registration)
      }

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event)
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
      throw error
    }
  }

  private handleServiceWorkerUpdate(worker: ServiceWorker): void {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New update available
          this.updateAvailable = true
          this.emit('updateAvailable', 'A new version is available', this.registration!)
        } else {
          // First time install
          this.emit('updateInstalled', 'App is ready for offline use', this.registration!)
        }
      }
    })
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event
    console.log('Message from Service Worker:', data)

    if (data.type === 'CACHE_UPDATED') {
      console.log('Cache updated:', data.url)
    }

    if (data.type === 'OFFLINE_FALLBACK') {
      this.emit('offline', 'You are currently offline')
    }
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log('Install prompt available')
      event.preventDefault()
      this.deferredPrompt = event
      this.emit('installAvailable', 'App can be installed')
    })

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      this.deferredPrompt = null
      this.emit('appInstalled', 'App installed successfully')
    })
  }

  private setupPeriodicSync(): void {
    // Setup background sync for offline actions
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('Background sync supported')
    }
  }

  // Public methods

  public async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available')
      return false
    }

    try {
      this.deferredPrompt.prompt()
      const result = await this.deferredPrompt.userChoice
      console.log('Install prompt result:', result.outcome)
      
      this.deferredPrompt = null
      return result.outcome === 'accepted'
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    }
  }

  public async updateServiceWorker(): Promise<void> {
    if (!this.registration || !this.registration.waiting) {
      console.log('No service worker update available')
      return
    }

    try {
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload the page to use the new service worker
      window.location.reload()
    } catch (error) {
      console.error('Service worker update failed:', error)
      this.emit('error', 'Failed to update app')
    }
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission
    }

    return Notification.permission
  }

  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service worker not registered')
      return null
    }

    try {
      const permission = await this.requestNotificationPermission()
      if (permission !== 'granted') {
        console.log('Notification permission denied')
        return null
      }

      // Check if already subscribed
      const existingSubscription = await this.registration.pushManager.getSubscription()
      if (existingSubscription) {
        console.log('Already subscribed to push notifications')
        return existingSubscription
      }

      // Subscribe to push notifications
      // Note: You'll need to replace this with your actual VAPID public key
      const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY'
      
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource
      })

      console.log('Subscribed to push notifications:', subscription)
      
      // Send subscription to your server
      await this.sendSubscriptionToServer(subscription)
      
      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        const unsubscribed = await subscription.unsubscribe()
        if (unsubscribed) {
          // Notify server about unsubscription
          await this.removeSubscriptionFromServer(subscription)
        }
        return unsubscribed
      }
      return true
    } catch (error) {
      console.error('Push unsubscription failed:', error)
      return false
    }
  }

  public async showNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.registration) {
      console.error('Service worker not registered')
      return
    }

    const permission = await this.requestNotificationPermission()
    if (permission !== 'granted') {
      console.log('Notification permission not granted')
      return
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        data: payload.data,
        tag: 'portfolio-notification',
        requireInteraction: false
      })
    } catch (error) {
      console.error('Show notification failed:', error)
    }
  }

  public cacheUrls(urls: string[]): void {
    if (!this.registration || !this.registration.active) {
      console.log('Service worker not active')
      return
    }

    this.registration.active.postMessage({
      type: 'CACHE_URLS',
      urls
    })
  }

  public isOnline(): boolean {
    return navigator.onLine
  }

  public isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true
  }

  public isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null
  }

  // Event system
  public on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, [])
    }
    this.callbacks.get(event)!.push(callback)
  }

  public off(event: string, callback: Function): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, message: string, data?: any): void {
    const callbacks = this.callbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback({ type: event, message, data }))
    }
  }

  // Utility methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })

      if (!response.ok) {
        throw new Error('Failed to send subscription to server')
      }

      console.log('Subscription sent to server successfully')
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server')
      }

      console.log('Subscription removed from server successfully')
    } catch (error) {
      console.error('Failed to remove subscription from server:', error)
    }
  }
}

export default PWAManager
export { PWAManager }

// React hook for PWA functionality
export function usePWA() {
  const pwa = PWAManager.getInstance()

  return {
    isOnline: pwa.isOnline(),
    isInstalled: pwa.isInstalled(),
    canInstall: pwa.canInstall(),
    isUpdateAvailable: pwa.isUpdateAvailable(),
    promptInstall: () => pwa.promptInstall(),
    updateApp: () => pwa.updateServiceWorker(),
    subscribeToPush: () => pwa.subscribeToPushNotifications(),
    unsubscribeFromPush: () => pwa.unsubscribeFromPushNotifications(),
    showNotification: (payload: PushNotificationPayload) => pwa.showNotification(payload),
    cacheUrls: (urls: string[]) => pwa.cacheUrls(urls),
    on: (event: string, callback: Function) => pwa.on(event, callback),
    off: (event: string, callback: Function) => pwa.off(event, callback)
  }
}