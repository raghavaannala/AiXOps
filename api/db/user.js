// User management API - PostgreSQL version
import { query, queryOne } from '../../lib/database.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { uid } = req.query;

            if (!uid) {
                return res.status(400).json({ error: 'uid is required' });
            }

            const user = await queryOne(
                'SELECT * FROM users WHERE firebase_uid = $1',
                [uid]
            );

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Get user settings
            const settings = await queryOne(
                'SELECT * FROM user_settings WHERE user_id = $1',
                [user.id]
            );

            // Get Gmail connection
            const gmail = await queryOne(
                'SELECT id, email, connected, expires_at FROM gmail_connections WHERE user_id = $1',
                [user.id]
            );

            return res.status(200).json({
                user: {
                    id: user.id,
                    firebaseUid: user.firebase_uid,
                    email: user.email,
                    displayName: user.display_name,
                    photoUrl: user.photo_url
                },
                settings: settings ? {
                    thresholdMinutes: settings.threshold_minutes,
                    autoRefresh: !!settings.auto_refresh,
                    autoRedraft: !!settings.auto_redraft
                } : null,
                gmail: gmail ? {
                    email: gmail.email,
                    connected: !!gmail.connected,
                    expiresAt: gmail.expires_at
                } : null
            });
        }

        if (req.method === 'POST') {
            const { firebaseUid, email, displayName, photoUrl } = req.body;

            if (!firebaseUid) {
                return res.status(400).json({ error: 'firebaseUid is required' });
            }

            // Check if user exists
            const existingUser = await queryOne(
                'SELECT id FROM users WHERE firebase_uid = $1',
                [firebaseUid]
            );

            let userId;

            if (existingUser) {
                // Update existing user
                await query(
                    `UPDATE users SET 
                        email = $2,
                        display_name = $3,
                        photo_url = $4,
                        updated_at = NOW()
                    WHERE firebase_uid = $1`,
                    [firebaseUid, email, displayName, photoUrl]
                );
                userId = existingUser.id;
            } else {
                // Insert new user
                const result = await query(
                    `INSERT INTO users (firebase_uid, email, display_name, photo_url)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id`,
                    [firebaseUid, email, displayName, photoUrl]
                );
                userId = result[0].id;

                // Create default settings
                await query(
                    'INSERT INTO user_settings (user_id) VALUES ($1)',
                    [userId]
                );
            }

            return res.status(200).json({
                success: true,
                userId,
                isNew: !existingUser
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('User API error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
}
