// User settings API - PostgreSQL version
import { query, queryOne } from '../../lib/database.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Get user settings
        if (req.method === 'GET') {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            const settings = await queryOne(
                'SELECT * FROM user_settings WHERE user_id = $1',
                [parseInt(userId)]
            );

            if (!settings) {
                return res.status(404).json({ error: 'Settings not found' });
            }

            return res.status(200).json({
                thresholdMinutes: settings.threshold_minutes,
                autoRefresh: !!settings.auto_refresh,
                autoRedraft: !!settings.auto_redraft
            });
        }

        // PUT - Update user settings
        if (req.method === 'PUT') {
            const { userId, thresholdMinutes, autoRefresh, autoRedraft } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            // Build dynamic update
            const updates = [];
            const values = [];
            let paramIndex = 1;

            if (thresholdMinutes !== undefined) {
                updates.push(`threshold_minutes = $${paramIndex++}`);
                values.push(thresholdMinutes);
            }
            if (autoRefresh !== undefined) {
                updates.push(`auto_refresh = $${paramIndex++}`);
                values.push(autoRefresh ? 1 : 0);
            }
            if (autoRedraft !== undefined) {
                updates.push(`auto_redraft = $${paramIndex++}`);
                values.push(autoRedraft ? 1 : 0);
            }

            if (updates.length > 0) {
                updates.push(`updated_at = NOW()`);
                values.push(parseInt(userId));

                await query(
                    `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`,
                    values
                );
            }

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Settings API error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
}
