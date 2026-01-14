// PostgreSQL Database Connection Module - Neon Serverless
import { neon, neonConfig } from '@neondatabase/serverless';
import { Pool } from 'pg';

// Configure Neon for serverless
neonConfig.fetchConnectionCache = true;

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

// Neon SQL client for serverless (Vercel Edge/Serverless functions)
let sql = null;

// Standard Pool for local development
let pool = null;

// Determine if we're in serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Get the appropriate database client
export async function getClient() {
    if (!DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    if (isServerless) {
        // Use Neon serverless client
        if (!sql) {
            sql = neon(DATABASE_URL);
        }
        return sql;
    } else {
        // Use standard pg Pool for local development
        if (!pool) {
            pool = new Pool({
                connectionString: DATABASE_URL,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 30000, // Increased timeout
                ssl: {
                    rejectUnauthorized: false // Required for Neon
                }
            });
        }
        return pool;
    }
}

// Execute a query
export async function query(queryString, params = []) {
    try {
        if (isServerless) {
            const sql = await getClient();
            return await sql(queryString, params);
        } else {
            const pool = await getClient();
            const result = await pool.query(queryString, params);
            return result.rows;
        }
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
}

// Execute a query and return first row
export async function queryOne(queryString, params = []) {
    const result = await query(queryString, params);
    return Array.isArray(result) ? result[0] || null : null;
}

// Execute a query and return all rows
export async function queryAll(queryString, params = []) {
    return await query(queryString, params);
}

// Close the connection pool (for local only)
export async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
        console.log('Database connection closed');
    }
}

// Check if database is connected
export async function isConnected() {
    try {
        await query('SELECT 1 as connected');
        return true;
    } catch {
        return false;
    }
}

// Initialize database schema
export async function initializeSchema() {
    try {
        console.log('Initializing PostgreSQL schema...');

        // Create Users table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                firebase_uid VARCHAR(128) UNIQUE NOT NULL,
                email VARCHAR(255),
                display_name VARCHAR(255),
                photo_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create Gmail Connections table
        await query(`
            CREATE TABLE IF NOT EXISTS gmail_connections (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                email VARCHAR(255),
                access_token TEXT,
                refresh_token TEXT,
                expires_at TIMESTAMP,
                connected SMALLINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create Tracked Emails table
        await query(`
            CREATE TABLE IF NOT EXISTS tracked_emails (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                gmail_id VARCHAR(100),
                thread_id VARCHAR(100) NOT NULL,
                recipient VARCHAR(255),
                sender VARCHAR(255),
                subject VARCHAR(500),
                snippet TEXT,
                body TEXT,
                sent_at TIMESTAMP,
                has_reply SMALLINT DEFAULT 0,
                dismissed SMALLINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create User Settings table
        await query(`
            CREATE TABLE IF NOT EXISTS user_settings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                threshold_minutes INTEGER DEFAULT 2880,
                auto_refresh SMALLINT DEFAULT 1,
                auto_redraft SMALLINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create Generated Drafts table
        await query(`
            CREATE TABLE IF NOT EXISTS generated_drafts (
                id SERIAL PRIMARY KEY,
                tracked_email_id INTEGER NOT NULL REFERENCES tracked_emails(id) ON DELETE CASCADE,
                content TEXT,
                generated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create Push Subscriptions table for FCM tokens
        await query(`
            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                fcm_token TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Create indexes
        await query(`CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_id ON tracked_emails(user_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_tracked_emails_thread_id ON tracked_emails(thread_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_gmail_connections_user_id ON gmail_connections(user_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)`);

        console.log('✅ PostgreSQL schema initialized successfully');
        return true;

    } catch (error) {
        console.error('❌ Schema initialization failed:', error.message);
        throw error;
    }
}

export default {
    getClient,
    query,
    queryOne,
    queryAll,
    closePool,
    isConnected,
    initializeSchema
};
