// AI Draft API - Generates follow-up email drafts using Cerebras AI
import { generateFollowUp, generateFollowUpStream } from '../../lib/cerebras.js';

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

    const { originalEmail, options = {}, stream = false } = req.body;

    if (!originalEmail) {
        return res.status(400).json({ error: 'originalEmail is required' });
    }

    if (!originalEmail.to || !originalEmail.subject) {
        return res.status(400).json({ error: 'originalEmail must have to and subject fields' });
    }

    try {
        if (stream) {
            // Streaming response
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const streamResponse = await generateFollowUpStream(originalEmail, options);

            for await (const chunk of streamResponse) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }

            res.write('data: [DONE]\n\n');
            res.end();
        } else {
            // Regular response
            const result = await generateFollowUp(originalEmail, options);
            return res.status(200).json({
                success: true,
                draft: result.content,
                usage: result.usage
            });
        }
    } catch (error) {
        console.error('AI draft error:', error);

        if (error.message?.includes('CEREBRAS_API_KEY')) {
            return res.status(500).json({
                error: 'Cerebras API key not configured',
                details: 'Please set the CEREBRAS_API_KEY environment variable'
            });
        }

        return res.status(500).json({
            error: 'Failed to generate email draft',
            details: error.message
        });
    }
}
