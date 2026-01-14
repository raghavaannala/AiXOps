// Gmail Check Replies API - Check if sent emails have received replies
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

    const { accessToken, threadIds } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: 'Access token required' });
    }

    if (!threadIds || !Array.isArray(threadIds) || threadIds.length === 0) {
        return res.status(400).json({ error: 'threadIds array is required' });
    }

    try {
        // Check each thread for replies
        const results = await Promise.all(
            threadIds.map(async (threadId) => {
                try {
                    const threadResponse = await fetch(
                        `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata&metadataHeaders=From`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (!threadResponse.ok) {
                        return { threadId, error: 'Failed to fetch thread', hasReply: null };
                    }

                    const thread = await threadResponse.json();
                    const messages = thread.messages || [];

                    // If there's more than 1 message in the thread, there's a reply
                    // We also check if the last message is not from us (it's a reply to us)
                    if (messages.length > 1) {
                        // Get the user's email from the profile
                        const profileResponse = await fetch(
                            'https://gmail.googleapis.com/gmail/v1/users/me/profile',
                            { headers: { Authorization: `Bearer ${accessToken}` } }
                        );

                        if (profileResponse.ok) {
                            const profile = await profileResponse.json();
                            const userEmail = profile.emailAddress;

                            // Check if any message after the first one is from someone else
                            for (let i = 1; i < messages.length; i++) {
                                const fromHeader = messages[i].payload?.headers?.find(
                                    h => h.name.toLowerCase() === 'from'
                                )?.value || '';

                                // If the message is not from the user, it's a reply
                                if (!fromHeader.toLowerCase().includes(userEmail.toLowerCase())) {
                                    return {
                                        threadId,
                                        hasReply: true,
                                        replyCount: messages.length - 1,
                                        lastMessageFrom: fromHeader
                                    };
                                }
                            }
                        }

                        // If we couldn't determine, assume there might be replies
                        return { threadId, hasReply: messages.length > 1, replyCount: messages.length - 1 };
                    }

                    return { threadId, hasReply: false, replyCount: 0 };

                } catch (err) {
                    return { threadId, error: err.message, hasReply: null };
                }
            })
        );

        // Separate into pending (no reply) and replied
        const pending = results.filter(r => r.hasReply === false);
        const replied = results.filter(r => r.hasReply === true);
        const errors = results.filter(r => r.hasReply === null);

        return res.status(200).json({
            results,
            summary: {
                total: results.length,
                pending: pending.length,
                replied: replied.length,
                errors: errors.length
            }
        });

    } catch (error) {
        console.error('Gmail check replies error:', error);
        return res.status(500).json({ error: 'Failed to check replies' });
    }
}
