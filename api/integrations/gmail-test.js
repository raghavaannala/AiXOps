// Gmail Test Endpoint - Verifies Gmail connection by fetching profile
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

    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: 'Access token required' });
    }

    try {
        // Test Gmail API access by getting user profile
        const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!profileResponse.ok) {
            const error = await profileResponse.json();
            return res.status(401).json({
                error: 'Gmail access failed',
                details: error,
                needsReauth: true
            });
        }

        const profile = await profileResponse.json();

        // Also get recent messages count to show it's working
        const messagesResponse = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const messages = await messagesResponse.json();

        return res.status(200).json({
            success: true,
            email: profile.emailAddress,
            messagesTotal: profile.messagesTotal,
            threadsTotal: profile.threadsTotal,
            recentMessagesCount: messages.messages?.length || 0
        });

    } catch (error) {
        console.error('Gmail test error:', error);
        return res.status(500).json({ error: 'Failed to test Gmail connection' });
    }
}
