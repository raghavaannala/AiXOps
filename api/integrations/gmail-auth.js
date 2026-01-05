// Gmail OAuth URL Generator - Initiates OAuth flow with offline access for refresh tokens
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.headers.origin || 'http://localhost:5173'}/auth/gmail/callback`;

    if (!clientId) {
        return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' });
    }

    // Get Firebase UID from request to include in state (for security)
    const firebaseUid = req.query.uid;
    if (!firebaseUid) {
        return res.status(400).json({ error: 'Firebase UID required' });
    }

    // Build OAuth URL with offline access for refresh token
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email'
    ].join(' ');

    const state = Buffer.from(JSON.stringify({ uid: firebaseUid, ts: Date.now() })).toString('base64');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline'); // This gets us refresh token!
    authUrl.searchParams.set('prompt', 'consent'); // Force consent to always get refresh token
    authUrl.searchParams.set('state', state);

    return res.status(200).json({
        authUrl: authUrl.toString(),
        redirectUri
    });
}
