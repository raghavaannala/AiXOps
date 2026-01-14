import { useState } from 'react';

export default function EmailComposer({
    initialTo = '',
    initialSubject = '',
    initialBody = '',
    threadId = null,
    onSend,
    onCancel,
    onRegenerate,
    accessToken
}) {
    const [to, setTo] = useState(initialTo);
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const handleSend = async () => {
        if (!to || !subject || !body) {
            setError('Please fill in all fields');
            return;
        }

        setSending(true);
        setError(null);

        try {
            const response = await fetch('/api/integrations/gmail-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken,
                    to,
                    subject,
                    body,
                    threadId
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send email');
            }

            const result = await response.json();

            if (onSend) {
                onSend(result);
            }

        } catch (err) {
            console.error('Send error:', err);
            setError(err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ✉️ Compose Follow-up
                    </h3>
                    <button
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '0.25rem'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Form */}
                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            marginBottom: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.375rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: '#334155'
                        }}>
                            To
                        </label>
                        <input
                            type="email"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="recipient@example.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9375rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.375rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: '#334155'
                        }}>
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9375rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.375rem',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: '#334155'
                        }}>
                            Message
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your follow-up message..."
                            rows={10}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9375rem',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                lineHeight: 1.5
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#f8fafc'
                }}>
                    <div>
                        {onRegenerate && (
                            <button
                                onClick={onRegenerate}
                                style={{
                                    background: 'none',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '0.625rem 1rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    color: '#6366f1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                }}
                            >
                                🤖 Regenerate with AI
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={onCancel}
                            style={{
                                background: 'none',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: '0.625rem 1.25rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                color: '#64748b'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={sending || !to || !subject || !body}
                            className="btn btn-primary"
                            style={{
                                padding: '0.625rem 1.5rem',
                                fontSize: '0.875rem',
                                opacity: sending || !to || !subject || !body ? 0.6 : 1
                            }}
                        >
                            {sending ? '📤 Sending...' : '📧 Send Email'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
