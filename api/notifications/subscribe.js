// Push notification subscription API
import { query, queryOne } from '../../lib/database.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, fcmToken } = req.body;

        if (!userId || !fcmToken) {
            return res.status(400).json({ error: 'userId and fcmToken required' });
        }

        // Check if token already exists
        const existing = await queryOne(
            'SELECT id FROM push_subscriptions WHERE fcm_token = $1',
            [fcmToken]
        );

        if (existing) {
            // Update existing subscription
            await query(
                'UPDATE push_subscriptions SET user_id = $1, updated_at = NOW() WHERE fcm_token = $2',
                [parseInt(userId), fcmToken]
            );
        } else {
            // Create new subscription
            await query(
                'INSERT INTO push_subscriptions (user_id, fcm_token) VALUES ($1, $2)',
                [parseInt(userId), fcmToken]
            );
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Subscribe error:', error);
        return res.status(500).json({ error: 'Failed to subscribe', details: error.message });
    }
}
