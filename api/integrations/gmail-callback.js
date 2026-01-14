// Gmail OAuth Callback Handler - Exchanges code for tokens and stores refresh token
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, state } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/gmail/callback';

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'OAuth credentials not configured' });
    }

    try {
        // Decode state to get Firebase UID
        let firebaseUid = null;
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
                firebaseUid = decoded.uid;
            } catch (e) {
                console.error('Failed to decode state:', e);
            }
        }

        console.log('Gmail callback - exchanging code for tokens...');
        console.log('Redirect URI used:', redirectUri);

        // Exchange authorization code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri
            })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Token exchange error:', tokens);
            return res.status(400).json({
                error: tokens.error_description || tokens.error,
                details: tokens.error === 'invalid_grant'
                    ? 'Authorization code expired or already used. Please try connecting again.'
                    : tokens.error === 'redirect_uri_mismatch'
                        ? 'Redirect URI mismatch. Check GOOGLE_REDIRECT_URI in .env'
                        : null
            });
        }

        // Get user email from Gmail API
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const profile = await profileResponse.json();

        // Store tokens securely (in production, encrypt and store in database)
        // For now, we'll return them to the frontend to store in localStorage
        // In production: Store in PostgreSQL with encryption

        const connectionData = {
            email: profile.email,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + (tokens.expires_in * 1000),
            scope: tokens.scope,
            firebaseUid
        };

        // TODO: In production, store in database:
        // await db.query('INSERT INTO gmail_connections ... ON CONFLICT DO UPDATE ...');

        return res.status(200).json({
            success: true,
            email: profile.email,
            expiresAt: connectionData.expiresAt,
            // Return tokens to frontend for storage (in production, only store in backend)
            tokens: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: connectionData.expiresAt
            }
        });

    } catch (error) {
        console.error('Gmail callback error:', error);
        return res.status(500).json({ error: 'Failed to complete Gmail authorization' });
    }
}
