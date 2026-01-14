// Firebase Cloud Messaging Service Worker
// This runs in the background and receives push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: "AIzaSyB4qlOrr88XUE9vSQ1jYY1ZzAEBjjkjyaU",
    authDomain: "smartagrox-c8990.firebaseapp.com",
    projectId: "smartagrox-c8990",
    storageBucket: "smartagrox-c8990.firebasestorage.app",
    messagingSenderId: "1040204518562",
    appId: "1:1040204518562:web:4660e0cba69a6d04a0f3fb"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'AiOps Reminder';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a pending follow-up',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        tag: payload.data?.tag || 'aiops-notification',
        requireInteraction: true,
        data: {
            url: payload.data?.url || '/',
            ...payload.data
        },
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Open the app or focus on existing window
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.focus();
                        if (urlToOpen !== '/') {
                            client.navigate(urlToOpen);
                        }
                        return;
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
    console.log('[SW] Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Service Worker activated');
    event.waitUntil(clients.claim());
});
