import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Create notification context
const NotificationContext = createContext();

// Toast notification types and their styles
const TOAST_STYLES = {
    success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        icon: '✅',
        title: 'Success'
    },
    error: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        icon: '❌',
        title: 'Error'
    },
    warning: {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        icon: '⚠️',
        title: 'Warning'
    },
    info: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        icon: 'ℹ️',
        title: 'Info'
    },
    ai: {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        icon: '🤖',
        title: 'AI Assistant'
    },
    reminder: {
        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        icon: '🔔',
        title: 'Reminder'
    }
};

// Request browser notification permission
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    return false;
}

// Send browser push notification
export function sendBrowserNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        return null;
    }

    const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        requireInteraction: options.persistent || false,
        ...options
    });

    // Handle click - navigate to specified URL
    if (options.onClick || options.url) {
        notification.onclick = () => {
            window.focus();
            if (options.url) {
                window.location.href = options.url;
            }
            if (options.onClick) {
                options.onClick();
            }
            notification.close();
        };
    }

    return notification;
}

// Individual toast component
function Toast({ id, type, title, message, onClose, onClick, duration = 5000 }) {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const style = TOAST_STYLES[type] || TOAST_STYLES.info;

    useEffect(() => {
        if (duration > 0) {
            // Progress bar animation
            const startTime = Date.now();
            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
                setProgress(remaining);
            }, 50);

            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onClose(id), 300);
            }, duration);

            return () => {
                clearTimeout(timer);
                clearInterval(interval);
            };
        }
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    const handleClick = () => {
        if (onClick) {
            onClick();
            handleClose();
        }
    };

    return (
        <div
            onClick={onClick ? handleClick : undefined}
            style={{
                background: style.background,
                color: 'white',
                padding: '1rem 1.25rem',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                minWidth: '320px',
                maxWidth: '420px',
                animation: isExiting
                    ? 'toastSlideOut 0.3s ease-out forwards'
                    : 'toastSlideIn 0.4s cubic-bezier(0.21, 1.02, 0.73, 1)',
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Progress bar at bottom */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                width: `${progress}%`,
                background: 'rgba(255,255,255,0.4)',
                transition: 'width 0.05s linear'
            }} />

            <span style={{ fontSize: '1.5rem', marginTop: '0.125rem' }}>{style.icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontWeight: 700,
                    marginBottom: '0.25rem',
                    fontSize: '0.9375rem'
                }}>
                    {title || style.title}
                </div>
                <div style={{
                    fontSize: '0.875rem',
                    opacity: 0.95,
                    lineHeight: 1.4
                }}>
                    {message}
                </div>
                {onClick && (
                    <div style={{
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        opacity: 0.8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <span>👆</span> Click to open
                    </div>
                )}
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
                ×
            </button>
        </div>
    );
}

// Toast container component
function ToastContainer({ toasts, removeToast }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                zIndex: 9999,
                pointerEvents: 'none'
            }}
        >
            <style>
                {`
                    @keyframes toastSlideIn {
                        from {
                            transform: translateX(120%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                    @keyframes toastSlideOut {
                        from {
                            transform: translateX(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateX(120%);
                            opacity: 0;
                        }
                    }
                `}
            </style>
            {toasts.map(toast => (
                <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                    <Toast
                        {...toast}
                        onClose={removeToast}
                    />
                </div>
            ))}
        </div>
    );
}

// Notification provider component
export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Check notification permission on mount
    useEffect(() => {
        if ('Notification' in window) {
            setPermissionGranted(Notification.permission === 'granted');
        }
    }, []);

    const addToast = useCallback((type, title, message, options = {}) => {
        const id = Date.now() + Math.random();
        const { duration = 6000, onClick, url, browserNotification = false } = options;

        // Add to in-app toasts
        setToasts(prev => [...prev, { id, type, title, message, duration, onClick }]);

        // Also send browser notification if requested
        if (browserNotification && permissionGranted) {
            sendBrowserNotification(title || TOAST_STYLES[type]?.title || 'Notification', {
                body: message,
                tag: id.toString(),
                url,
                onClick
            });
        }

        return id;
    }, [permissionGranted]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Request permission helper
    const requestPermission = async () => {
        const granted = await requestNotificationPermission();
        setPermissionGranted(granted);
        return granted;
    };

    const notify = {
        success: (title, message, options) => addToast('success', title, message, options),
        error: (title, message, options) => addToast('error', title, message, options),
        warning: (title, message, options) => addToast('warning', title, message, options),
        info: (title, message, options) => addToast('info', title, message, options),
        ai: (title, message, options) => addToast('ai', title, message, options),
        reminder: (title, message, options) => addToast('reminder', title, message, {
            ...options,
            browserNotification: true,
            duration: 10000
        }),
        requestPermission,
        permissionGranted
    };

    return (
        <NotificationContext.Provider value={notify}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </NotificationContext.Provider>
    );
}

// Hook to use notifications
export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        return {
            success: () => { },
            error: () => { },
            warning: () => { },
            info: () => { },
            ai: () => { },
            reminder: () => { },
            requestPermission: async () => false,
            permissionGranted: false
        };
    }
    return context;
}

export default NotificationProvider;
