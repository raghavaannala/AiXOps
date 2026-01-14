// Cerebras AI service module for email assistance
// Uses Cerebras Cloud SDK with llama-3.3-70b model

import Cerebras from '@cerebras/cerebras_cloud_sdk';

// Initialize Cerebras client (API key from environment)
function getCerebrasClient() {
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
        throw new Error('CEREBRAS_API_KEY environment variable is required');
    }
    return new Cerebras({ apiKey });
}

// Generate a follow-up email based on original email context
export async function generateFollowUp(originalEmail, options = {}) {
    const client = getCerebrasClient();

    const {
        daysSinceOriginal = 2,
        urgency = 'medium', // low, medium, high
        customInstructions = ''
    } = options;

    const systemPrompt = `You are a professional email assistant. Your job is to help draft polite, professional follow-up emails.
Keep emails concise, professional, and friendly. Match the tone of the original email.
Do not be pushy or aggressive. Be respectful of the recipient's time.
Only output the email body text, no subject line or headers.`;

    const userPrompt = `Write a follow-up email for the following context:

Original Email To: ${originalEmail.to}
Original Subject: ${originalEmail.subject}
Original Email Body:
${originalEmail.body}

Days since original email: ${daysSinceOriginal}
Urgency level: ${urgency}
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Generate a professional follow-up email body:`;

    const response = await client.chat.completions.create({
        model: 'llama-3.3-70b',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1024,
        temperature: 0.4,
        top_p: 1
    });

    return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage
    };
}

// Generate a follow-up with streaming for real-time display
export async function generateFollowUpStream(originalEmail, options = {}) {
    const client = getCerebrasClient();

    const {
        daysSinceOriginal = 2,
        urgency = 'medium',
        customInstructions = ''
    } = options;

    const systemPrompt = `You are a professional email assistant. Your job is to help draft polite, professional follow-up emails.
Keep emails concise, professional, and friendly. Match the tone of the original email.
Do not be pushy or aggressive. Be respectful of the recipient's time.
Only output the email body text, no subject line or headers.`;

    const userPrompt = `Write a follow-up email for the following context:

Original Email To: ${originalEmail.to}
Original Subject: ${originalEmail.subject}
Original Email Body:
${originalEmail.body}

Days since original email: ${daysSinceOriginal}
Urgency level: ${urgency}
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

Generate a professional follow-up email body:`;

    const stream = await client.chat.completions.create({
        model: 'llama-3.3-70b',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        stream: true,
        max_completion_tokens: 1024,
        temperature: 0.4,
        top_p: 1
    });

    return stream;
}

// Redraft an email based on user instructions
export async function redraftEmail(originalEmail, instructions) {
    const client = getCerebrasClient();

    const systemPrompt = `You are a professional email assistant. Your job is to help improve and redraft emails.
Follow the user's instructions carefully while maintaining professionalism.
Only output the email body text, no subject line or headers unless specifically asked.`;

    const userPrompt = `Current email draft:
To: ${originalEmail.to}
Subject: ${originalEmail.subject}
Body:
${originalEmail.body}

Instructions for redraft: ${instructions}

Please provide the improved email:`;

    const response = await client.chat.completions.create({
        model: 'llama-3.3-70b',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1024,
        temperature: 0.3,
        top_p: 1
    });

    return {
        content: response.choices[0]?.message?.content || '',
        usage: response.usage
    };
}
