// Gmail Token Refresh - Uses refresh token to get new access token
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

    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'OAuth credentials not configured' });
    }

    try {
        // Use refresh token to get new access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token'
            })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Token refresh error:', tokens);
            return res.status(400).json({
                error: tokens.error_description || tokens.error,
                needsReauth: true
            });
        }

        return res.status(200).json({
            success: true,
            accessToken: tokens.access_token,
            expiresAt: Date.now() + (tokens.expires_in * 1000)
        });

    } catch (error) {
        console.error('Gmail refresh error:', error);
        return res.status(500).json({ error: 'Failed to refresh token' });
    }
}
