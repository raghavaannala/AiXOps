// Gmail Send Email API - Send emails via Gmail
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

    const { accessToken, to, subject, body, threadId, inReplyTo, references } = req.body;

    if (!accessToken) {
        return res.status(400).json({ error: 'Access token required' });
    }

    if (!to || !subject || !body) {
        return res.status(400).json({ error: 'to, subject, and body are required' });
    }

    try {
        // Get user's email for the From header
        const profileResponse = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/profile',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!profileResponse.ok) {
            return res.status(401).json({ error: 'Failed to get user profile' });
        }

        const profile = await profileResponse.json();
        const userEmail = profile.emailAddress;

        // Build RFC 2822 formatted email
        let emailLines = [
            `From: ${userEmail}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'MIME-Version: 1.0'
        ];

        // Add reply headers if this is a follow-up
        if (inReplyTo) {
            emailLines.push(`In-Reply-To: ${inReplyTo}`);
        }
        if (references) {
            emailLines.push(`References: ${references}`);
        }

        // Add blank line and body
        emailLines.push('');
        emailLines.push(body);

        const rawEmail = emailLines.join('\r\n');

        // Encode to base64url format
        const encodedEmail = Buffer.from(rawEmail)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Prepare request body
        const requestBody = { raw: encodedEmail };

        // Add threadId if replying to a thread
        if (threadId) {
            requestBody.threadId = threadId;
        }

        // Send the email
        const sendResponse = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!sendResponse.ok) {
            const error = await sendResponse.json();
            console.error('Gmail send error:', error);
            return res.status(sendResponse.status).json({
                error: 'Failed to send email',
                details: error
            });
        }

        const result = await sendResponse.json();

        return res.status(200).json({
            success: true,
            messageId: result.id,
            threadId: result.threadId
        });

    } catch (error) {
        console.error('Gmail send error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
