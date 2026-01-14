// Gmail Fetch Emails API - Retrieves emails from Gmail inbox
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

    const { accessToken, maxResults = 20, query = '' } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: 'Access token required' });
    }

    try {
        // Build query params
        const params = new URLSearchParams({
            maxResults: maxResults.toString(),
            labelIds: 'INBOX'
        });
        if (query) {
            params.set('q', query);
        }

        // Fetch message list
        const listResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!listResponse.ok) {
            const error = await listResponse.json();
            return res.status(401).json({
                error: 'Failed to fetch emails',
                details: error,
                needsReauth: listResponse.status === 401
            });
        }

        const listData = await listResponse.json();

        if (!listData.messages || listData.messages.length === 0) {
            return res.status(200).json({ emails: [], total: 0 });
        }

        // Fetch details for each message (batch)
        const emails = await Promise.all(
            listData.messages.slice(0, maxResults).map(async (msg) => {
                const detailResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                if (!detailResponse.ok) {
                    return null;
                }

                const detail = await detailResponse.json();

                // Extract headers
                const headers = detail.payload?.headers || [];
                const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

                return {
                    id: detail.id,
                    threadId: detail.threadId,
                    snippet: detail.snippet,
                    from: getHeader('From'),
                    subject: getHeader('Subject'),
                    date: getHeader('Date'),
                    isUnread: detail.labelIds?.includes('UNREAD') || false,
                    isStarred: detail.labelIds?.includes('STARRED') || false,
                    labels: detail.labelIds || []
                };
            })
        );

        // Filter out any failed fetches
        const validEmails = emails.filter(e => e !== null);

        return res.status(200).json({
            emails: validEmails,
            total: listData.resultSizeEstimate || validEmails.length,
            nextPageToken: listData.nextPageToken
        });

    } catch (error) {
        console.error('Gmail fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch emails' });
    }
}
