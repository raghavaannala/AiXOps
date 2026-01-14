// Gmail Fetch Sent Emails API - Retrieves sent emails with thread tracking
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { accessToken, maxResults = 20, daysBack = 30 } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: 'Access token required' });
    }

    try {
        // Calculate the date filter for recent emails
        const afterDate = new Date();
        afterDate.setDate(afterDate.getDate() - daysBack);
        const afterTimestamp = Math.floor(afterDate.getTime() / 1000);

        // Build query for sent emails
        const params = new URLSearchParams({
            maxResults: maxResults.toString(),
            labelIds: 'SENT',
            q: `after:${afterTimestamp}`
        });

        // Fetch message list
        const listResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!listResponse.ok) {
            const error = await listResponse.json();
            return res.status(401).json({
                error: 'Failed to fetch sent emails',
                details: error,
                needsReauth: listResponse.status === 401
            });
        }

        const listData = await listResponse.json();

        if (!listData.messages || listData.messages.length === 0) {
            return res.status(200).json({ emails: [], total: 0 });
        }

        // Fetch details for each message
        const emails = await Promise.all(
            listData.messages.slice(0, maxResults).map(async (msg) => {
                const detailResponse = await fetch(
                    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                if (!detailResponse.ok) {
                    return null;
                }

                const detail = await detailResponse.json();

                // Extract headers
                const headers = detail.payload?.headers || [];
                const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

                // Extract email body
                let body = '';
                if (detail.payload?.body?.data) {
                    body = Buffer.from(detail.payload.body.data, 'base64').toString('utf-8');
                } else if (detail.payload?.parts) {
                    const textPart = detail.payload.parts.find(p => p.mimeType === 'text/plain');
                    if (textPart?.body?.data) {
                        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
                    }
                }

                return {
                    id: detail.id,
                    threadId: detail.threadId,
                    snippet: detail.snippet,
                    to: getHeader('To'),
                    from: getHeader('From'),
                    subject: getHeader('Subject'),
                    date: getHeader('Date'),
                    body: body,
                    labels: detail.labelIds || [],
                    // Calculate days since sent
                    daysSince: Math.floor((Date.now() - new Date(getHeader('Date')).getTime()) / (1000 * 60 * 60 * 24))
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
        console.error('Gmail sent fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch sent emails' });
    }
}
