// Firebase Cloud Messaging Module
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase config (same as auth)
const firebaseConfig = {
    apiKey: "AIzaSyB4qlOrr88XUE9vSQ1jYY1ZzAEBjjkjyaU",
    authDomain: "smartagrox-c8990.firebaseapp.com",
    projectId: "smartagrox-c8990",
    storageBucket: "smartagrox-c8990.firebasestorage.app",
    messagingSenderId: "1040204518562",
    appId: "1:1040204518562:web:4660e0cba69a6d04a0f3fb"
};

let messaging = null;
let app = null;

// Initialize FCM
export function initializeFCM() {
    if (messaging) return messaging;

    try {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return null;
        }

        app = initializeApp(firebaseConfig, 'fcm-app');
        messaging = getMessaging(app);

        console.log('✅ FCM initialized');
        return messaging;
    } catch (error) {
        console.error('FCM initialization error:', error);
        return null;
    }
}

// Request permission and get FCM token
export async function getFCMToken() {
    try {
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Register service worker and WAIT for it to be ready
        let registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

        if (!registration) {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered:', registration);
        }

        // Wait for the service worker to be ready (active)
        if (registration.installing) {
            console.log('Waiting for Service Worker to install...');
            await new Promise((resolve) => {
                registration.installing.addEventListener('statechange', function () {
                    if (this.state === 'activated') {
                        resolve();
                    }
                });
            });
        } else if (registration.waiting) {
            console.log('Waiting for Service Worker to activate...');
            await new Promise((resolve) => {
                registration.waiting.addEventListener('statechange', function () {
                    if (this.state === 'activated') {
                        resolve();
                    }
                });
            });
        }

        // Also wait for navigator.serviceWorker.ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker is active and ready');

        // Initialize FCM
        const fcm = initializeFCM();
        if (!fcm) return null;

        // Get FCM token
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
            console.warn('VAPID key not set. Add VITE_FIREBASE_VAPID_KEY to your .env');
            // Still enable basic browser notifications even without VAPID
            return 'local-only';
        }

        const token = await getToken(fcm, {
            vapidKey,
            serviceWorkerRegistration: registration
        });

        if (token) {
            console.log('✅ FCM Token obtained');
            return token;
        } else {
            console.log('No FCM token available, using local-only mode');
            return 'local-only';
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
        // Return local-only mode - basic notifications still work
        return 'local-only';
    }
}

// Subscribe to push notifications and save token to backend
export async function subscribeToPushNotifications(userId) {
    const token = await getFCMToken();

    if (!token) {
        return { success: false, reason: 'no_token' };
    }

    // If local-only mode (no VAPID key), just enable browser notifications
    if (token === 'local-only') {
        localStorage.setItem('fcm_token', 'local-only');
        return { success: true, token: 'local-only', mode: 'local' };
    }

    try {
        // Save token to backend
        const response = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, fcmToken: token })
        });

        if (response.ok) {
            // Store token locally for reference
            localStorage.setItem('fcm_token', token);
            return { success: true, token, mode: 'push' };
        } else {
            // Still enable local notifications
            localStorage.setItem('fcm_token', 'local-only');
            return { success: true, token: 'local-only', mode: 'local' };
        }
    } catch (error) {
        console.error('Subscribe error:', error);
        // Still enable local notifications even on error
        localStorage.setItem('fcm_token', 'local-only');
        return { success: true, token: 'local-only', mode: 'local' };
    }
}

// Listen for foreground messages
export function onForegroundMessage(callback) {
    const fcm = initializeFCM();
    if (!fcm) return () => { };

    return onMessage(fcm, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
}

// Unsubscribe from push notifications
export async function unsubscribeFromPushNotifications(userId) {
    const token = localStorage.getItem('fcm_token');

    if (!token) return { success: true };

    try {
        await fetch('/api/notifications/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, fcmToken: token })
        });

        localStorage.removeItem('fcm_token');
        return { success: true };
    } catch (error) {
        console.error('Unsubscribe error:', error);
        return { success: false, reason: error.message };
    }
}

export default {
    initializeFCM,
    getFCMToken,
    subscribeToPushNotifications,
    onForegroundMessage,
    unsubscribeFromPushNotifications
};
