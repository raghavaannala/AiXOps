import { useState, useEffect } from 'react';
import { useNotification } from './Notifications';
import { subscribeToPushNotifications, onForegroundMessage } from '../fcmUtils';

export default function NotificationBanner({ userId }) {
    const notify = useNotification();
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        // Check if we should show the banner
        const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        const permission = isSupported ? Notification.permission : 'denied';
        const wasDismissed = localStorage.getItem('notification_banner_dismissed');
        const hasToken = localStorage.getItem('fcm_token');

        if (isSupported && permission !== 'granted' && !wasDismissed) {
            // Show banner after a short delay
            setTimeout(() => setShowBanner(true), 2000);
        }

        if (hasToken) {
            setIsSubscribed(true);
        }

        // Listen for foreground messages
        const unsubscribe = onForegroundMessage((payload) => {
            // Show in-app notification for foreground messages
            notify.reminder(
                payload.notification?.title || 'Reminder',
                payload.notification?.body || 'You have a pending task',
                {
                    onClick: () => {
                        if (payload.data?.url) {
                            window.location.href = payload.data.url;
                        }
                    }
                }
            );
        });

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, [notify]);

    const handleEnable = async () => {
        try {
            // First request browser notification permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                notify.warning('Permission Denied', 'Please enable notifications in your browser settings');
                return;
            }

            // Subscribe to FCM
            const result = await subscribeToPushNotifications(userId);

            if (result.success) {
                setIsSubscribed(true);

                if (result.mode === 'push') {
                    notify.success('Push Notifications Enabled! 🔔', 'You\'ll receive reminders even when the browser is closed');
                } else {
                    notify.success('Notifications Enabled! 🔔', 'You\'ll see notifications while using the app. Add VAPID key for background notifications.');
                }
            } else {
                notify.warning('Setup Incomplete', 'Notifications enabled but some features require additional config');
            }

            setShowBanner(false);
        } catch (error) {
            console.error('Enable notifications error:', error);
            notify.error('Error', 'Failed to enable notifications. Please try again.');
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShowBanner(false);
        localStorage.setItem('notification_banner_dismissed', 'true');
    };

    if (!showBanner || dismissed) return null;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
                        Enable Push Notifications
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        Get reminders about pending follow-ups even when you close the browser
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                    onClick={handleEnable}
                    style={{
                        background: 'white',
                        color: '#6366f1',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Enable
                </button>
                <button
                    onClick={handleDismiss}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                    }}
                >
                    Later
                </button>
            </div>
        </div>
    );
}
