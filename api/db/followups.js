// Follow-up tracking API - PostgreSQL version
import { query, queryOne, queryAll } from '../../lib/database.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET - Fetch tracked emails
        if (req.method === 'GET') {
            const { userId, pending } = req.query;

            if (!userId) {
                return res.status(400).json({ error: 'userId is required' });
            }

            // Get threshold from settings
            const settings = await queryOne(
                'SELECT threshold_minutes FROM user_settings WHERE user_id = $1',
                [parseInt(userId)]
            );
            const thresholdMinutes = settings?.threshold_minutes || 2880;

            let emails;

            if (pending === 'true') {
                // Get pending follow-ups only
                emails = await queryAll(`
                    SELECT 
                        te.*,
                        gd.content as draft_content,
                        gd.generated_at as draft_generated_at
                    FROM tracked_emails te
                    LEFT JOIN generated_drafts gd ON te.id = gd.tracked_email_id
                    WHERE te.user_id = $1 
                      AND te.dismissed = 0
                      AND te.has_reply = 0
                      AND EXTRACT(EPOCH FROM (NOW() - te.sent_at))/60 >= $2
                    ORDER BY te.sent_at DESC
                `, [parseInt(userId), thresholdMinutes]);
            } else {
                emails = await queryAll(`
                    SELECT 
                        te.*,
                        gd.content as draft_content,
                        gd.generated_at as draft_generated_at
                    FROM tracked_emails te
                    LEFT JOIN generated_drafts gd ON te.id = gd.tracked_email_id
                    WHERE te.user_id = $1 AND te.dismissed = 0
                    ORDER BY te.sent_at DESC
                `, [parseInt(userId)]);
            }

            return res.status(200).json({
                emails: emails.map(e => ({
                    id: e.id,
                    threadId: e.thread_id,
                    gmailId: e.gmail_id,
                    to: e.recipient,
                    from: e.sender,
                    subject: e.subject,
                    snippet: e.snippet,
                    body: e.body,
                    date: e.sent_at,
                    hasReply: !!e.has_reply,
                    dismissed: !!e.dismissed,
                    draft: e.draft_content ? {
                        content: e.draft_content,
                        generatedAt: e.draft_generated_at
                    } : null
                })),
                thresholdMinutes
            });
        }

        // POST - Add/sync tracked emails
        if (req.method === 'POST') {
            const { userId, emails } = req.body;

            if (!userId || !emails || !Array.isArray(emails)) {
                return res.status(400).json({ error: 'userId and emails array required' });
            }

            let addedCount = 0;
            let updatedCount = 0;

            for (const email of emails) {
                const existing = await queryOne(
                    'SELECT id FROM tracked_emails WHERE user_id = $1 AND thread_id = $2',
                    [parseInt(userId), email.threadId]
                );

                if (existing) {
                    await query(
                        `UPDATE tracked_emails SET has_reply = $1, updated_at = NOW() WHERE id = $2`,
                        [email.hasReply ? 1 : 0, existing.id]
                    );
                    updatedCount++;
                } else {
                    await query(
                        `INSERT INTO tracked_emails 
                            (user_id, gmail_id, thread_id, recipient, sender, subject, snippet, body, sent_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            parseInt(userId),
                            email.id || null,
                            email.threadId,
                            email.to || null,
                            email.from || null,
                            email.subject || null,
                            email.snippet || null,
                            email.body || null,
                            email.date ? new Date(email.date) : new Date()
                        ]
                    );
                    addedCount++;
                }
            }

            return res.status(200).json({ success: true, added: addedCount, updated: updatedCount });
        }

        // PUT - Update email status
        if (req.method === 'PUT') {
            const { id, action, content } = req.body;

            if (!id || !action) {
                return res.status(400).json({ error: 'id and action required' });
            }

            if (action === 'dismiss') {
                await query('UPDATE tracked_emails SET dismissed = 1, updated_at = NOW() WHERE id = $1', [parseInt(id)]);
            } else if (action === 'replied') {
                await query('UPDATE tracked_emails SET has_reply = 1, updated_at = NOW() WHERE id = $1', [parseInt(id)]);
            } else if (action === 'saveDraft' && content) {
                await query('DELETE FROM generated_drafts WHERE tracked_email_id = $1', [parseInt(id)]);
                await query('INSERT INTO generated_drafts (tracked_email_id, content) VALUES ($1, $2)', [parseInt(id), content]);
            }

            return res.status(200).json({ success: true });
        }

        // DELETE - Remove tracked email
        if (req.method === 'DELETE') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'id is required' });
            }

            await query('DELETE FROM tracked_emails WHERE id = $1', [parseInt(id)]);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Followups API error:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
}
