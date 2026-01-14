import { useState, useEffect } from 'react';

export default function EmailInbox({ accessToken, onEmailSelect }) {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (accessToken) {
            fetchEmails();
        }
    }, [accessToken]);

    const fetchEmails = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/integrations/gmail-fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, maxResults: 15 })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch emails');
            }

            setEmails(data.emails || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Email fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const extractName = (from) => {
        if (!from) return 'Unknown';
        const match = from.match(/^([^<]+)/);
        return match ? match[1].trim().replace(/"/g, '') : from.split('@')[0];
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading emails...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '12px',
                color: '#ef4444'
            }}>
                <p style={{ fontWeight: 600 }}>Failed to load emails</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>{error}</p>
                <button
                    onClick={fetchEmails}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (emails.length === 0) {
        return (
            <div style={{
                padding: '3rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                borderRadius: '16px',
                border: '2px dashed rgba(99, 102, 241, 0.2)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>No emails found</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Your inbox is empty or we couldn't fetch any emails.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                padding: '0 0.5rem'
            }}>
                <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                    Showing {emails.length} of {total} emails
                </span>
                <button
                    onClick={fetchEmails}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#6366f1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
            }}>
                {emails.map((email, index) => (
                    <div
                        key={email.id}
                        onClick={() => onEmailSelect?.(email)}
                        style={{
                            padding: '1rem 1.25rem',
                            borderBottom: index < emails.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            background: email.isUnread ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '1rem',
                            alignItems: 'start'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = email.isUnread ? 'rgba(99, 102, 241, 0.03)' : 'transparent'}
                    >
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.25rem'
                            }}>
                                {email.isUnread && (
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#6366f1',
                                        flexShrink: 0
                                    }} />
                                )}
                                <span style={{
                                    fontWeight: email.isUnread ? 700 : 500,
                                    color: '#0f172a',
                                    fontSize: '0.9375rem',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {extractName(email.from)}
                                </span>
                                {email.isStarred && (
                                    <span style={{ color: '#fbbf24' }}>★</span>
                                )}
                            </div>
                            <div style={{
                                fontWeight: email.isUnread ? 600 : 400,
                                color: '#334155',
                                fontSize: '0.875rem',
                                marginBottom: '0.25rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {email.subject || '(No subject)'}
                            </div>
                            <div style={{
                                color: '#94a3b8',
                                fontSize: '0.8125rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>
                                {email.snippet}
                            </div>
                        </div>
                        <div style={{
                            color: '#94a3b8',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            fontWeight: email.isUnread ? 600 : 400
                        }}>
                            {formatDate(email.date)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
