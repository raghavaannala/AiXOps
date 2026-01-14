// Database initialization API - Creates tables and sets up schema
import { initializeSchema, isConnected } from '../../lib/database.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Check connection first
        const connected = await isConnected();
        if (!connected) {
            return res.status(500).json({
                error: 'Database connection failed',
                hint: 'Check your DATABASE_URL in .env'
            });
        }

        // Initialize schema
        await initializeSchema();

        return res.status(200).json({
            success: true,
            message: 'PostgreSQL database initialized successfully',
            tables: ['users', 'gmail_connections', 'tracked_emails', 'user_settings', 'generated_drafts', 'push_subscriptions']
        });

    } catch (error) {
        console.error('Database init error:', error);
        return res.status(500).json({
            error: 'Database initialization failed',
            details: error.message,
            hint: 'Check your DATABASE_URL connection string'
        });
    }
}
