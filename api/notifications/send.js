// Send push notification API
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
let adminInitialized = false;

function initializeAdmin() {
    if (adminInitialized) return;

    // Check if credentials are set
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(JSON.parse(serviceAccount))
            });
            adminInitialized = true;
            console.log('✅ Firebase Admin initialized');
        } catch (error) {
            console.error('Firebase Admin init error:', error);
        }
    } else {
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY not set - push notifications disabled');
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        initializeAdmin();

        if (!adminInitialized) {
            return res.status(503).json({
                error: 'Push notifications not configured',
                hint: 'Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable'
            });
        }

        const { tokens, title, body, data, topic } = req.body;

        if (!tokens && !topic) {
            return res.status(400).json({ error: 'tokens or topic required' });
        }

        const message = {
            notification: {
                title: title || 'AiOps Reminder',
                body: body || 'You have a pending task'
            },
            data: {
                ...data,
                url: data?.url || '/dashboard',
                click_action: 'OPEN_APP'
            },
            webpush: {
                notification: {
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    requireInteraction: true
                },
                fcmOptions: {
                    link: data?.url || '/dashboard'
                }
            }
        };

        let response;

        if (topic) {
            // Send to topic
            response = await admin.messaging().send({
                ...message,
                topic
            });
        } else if (tokens.length === 1) {
            // Send to single device
            response = await admin.messaging().send({
                ...message,
                token: tokens[0]
            });
        } else {
            // Send to multiple devices
            response = await admin.messaging().sendEachForMulticast({
                ...message,
                tokens
            });
        }

        return res.status(200).json({
            success: true,
            response,
            messagesSent: tokens?.length || 1
        });

    } catch (error) {
        console.error('Send notification error:', error);
        return res.status(500).json({
            error: 'Failed to send notification',
            details: error.message
        });
    }
}
