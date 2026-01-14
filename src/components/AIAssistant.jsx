import { useState, useEffect, useRef, useCallback } from 'react';
import {
    getTrackedEmails,
    getPendingFollowups,
    dismissEmail,
    formatTimeSince,
    formatRecipient,
    getThresholdMinutes,
    setThresholdMinutes,
    syncSentEmails,
    thresholdToComponents,
    parseThreshold,
    formatThreshold
} from '../followupUtils';
import { useNotification } from './Notifications';

// Auto-refresh interval in milliseconds (every 60 seconds)
const AUTO_REFRESH_INTERVAL = 60000;

export default function AIAssistant({ accessToken, onComposeFollowup }) {
    const notify = useNotification();
    const [pendingEmails, setPendingEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);

    // Threshold state
    const initialThreshold = thresholdToComponents(getThresholdMinutes());
    const [thresholdDays, setThresholdDays] = useState(initialThreshold.days);
    const [thresholdHours, setThresholdHours] = useState(initialThreshold.hours);
    const [thresholdMins, setThresholdMins] = useState(initialThreshold.minutes);

    // Auto features state
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [autoRedraft, setAutoRedraft] = useState(true);

    const [expandedEmail, setExpandedEmail] = useState(null);
    const [draftLoading, setDraftLoading] = useState(null);
    const [generatedDrafts, setGeneratedDrafts] = useState({});
    const [sendingEmail, setSendingEmail] = useState(null);

    const refreshIntervalRef = useRef(null);

    // Load pending follow-ups
    const loadPendingFollowups = useCallback(async (showNotification = false) => {
        if (!accessToken) return;

        setLoading(prev => prev); // Keep loading state if already loading
        setError(null);

        try {
            // First sync sent emails
            await syncSentEmailsFromGmail();

            // Get tracked emails and check for replies
            const tracked = getTrackedEmails();

            if (tracked.emails.length === 0) {
                setPendingEmails([]);
                setLoading(false);
                return;
            }

            // Check which threads have replies
            const threadIds = tracked.emails.map(e => e.threadId);
            const response = await fetch('/api/integrations/gmail-check-replies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, threadIds })
            });

            if (!response.ok) {
                throw new Error('Failed to check replies');
            }

            const { results } = await response.json();
            const repliedThreadIds = results
                .filter(r => r.hasReply === true)
                .map(r => r.threadId);

            // Get pending follow-ups
            const pending = getPendingFollowups(repliedThreadIds);

            // Check for new pending emails
            const previousPendingIds = pendingEmails.map(e => e.threadId);
            const newPending = pending.filter(e => !previousPendingIds.includes(e.threadId));

            if (newPending.length > 0 && showNotification) {
                notify.warning(
                    'New Follow-ups Needed',
                    `${newPending.length} email${newPending.length > 1 ? 's' : ''} need follow-up!`
                );

                // Auto-redraft if enabled
                if (autoRedraft) {
                    for (const email of newPending) {
                        await handleGenerateDraft(email, true);
                    }
                }
            }

            setPendingEmails(pending);

        } catch (err) {
            console.error('Error loading follow-ups:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken, pendingEmails, autoRedraft, notify]);

    // Sync sent emails from Gmail
    const syncSentEmailsFromGmail = async () => {
        setSyncing(true);
        try {
            const response = await fetch('/api/integrations/gmail-sent-fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken, maxResults: 50, daysBack: 14 })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch sent emails');
            }

            const { emails } = await response.json();
            await syncSentEmails(emails);

        } catch (err) {
            console.error('Sync error:', err);
        } finally {
            setSyncing(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (accessToken) {
            loadPendingFollowups(false);
        }
    }, [accessToken]);

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh && accessToken) {
            refreshIntervalRef.current = setInterval(() => {
                loadPendingFollowups(true);
            }, AUTO_REFRESH_INTERVAL);

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                }
            };
        } else if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
        }
    }, [autoRefresh, accessToken, loadPendingFollowups]);

    const getTotalThresholdMinutes = () => {
        return parseThreshold(thresholdDays, thresholdHours, thresholdMins);
    };

    const handleThresholdApply = () => {
        const totalMinutes = getTotalThresholdMinutes();
        setThresholdMinutes(totalMinutes);
        loadPendingFollowups(false);
        notify.info('Threshold Updated', formatThreshold(totalMinutes));
    };

    const handleDismiss = (threadId) => {
        dismissEmail(threadId);
        setPendingEmails(prev => prev.filter(e => e.threadId !== threadId));
        notify.info('Dismissed', 'Email removed from follow-up list');
    };

    const handleGenerateDraft = async (email, silent = false) => {
        setDraftLoading(email.threadId);

        try {
            const response = await fetch('/api/ai/ai-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalEmail: {
                        to: email.to,
                        subject: email.subject,
                        body: email.body || email.snippet
                    },
                    options: {
                        daysSinceOriginal: Math.floor((Date.now() - new Date(email.date).getTime()) / (1000 * 60 * 60 * 24)),
                        urgency: 'medium'
                    }
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate draft');
            }

            const { draft } = await response.json();
            setGeneratedDrafts(prev => ({
                ...prev,
                [email.threadId]: {
                    email: email,
                    content: draft
                }
            }));

            if (!silent) {
                notify.ai('Draft Ready', `AI generated a follow-up for "${email.subject.substring(0, 30)}..."`);
            }

        } catch (err) {
            console.error('Draft generation error:', err);
            if (!silent) {
                notify.error('Draft Failed', err.message);
            }
            setError(err.message);
        } finally {
            setDraftLoading(null);
        }
    };

    // One-click resend
    const handleQuickResend = async (email) => {
        const draft = generatedDrafts[email.threadId];

        if (!draft) {
            // Generate draft first, then send
            notify.ai('Generating Draft', 'Please wait...');
            await handleGenerateDraft(email, true);
            // Check if draft was generated
            setTimeout(() => {
                const newDraft = generatedDrafts[email.threadId];
                if (newDraft) {
                    sendEmail(email, newDraft.content);
                }
            }, 100);
            return;
        }

        await sendEmail(email, draft.content);
    };

    const sendEmail = async (email, bodyContent) => {
        setSendingEmail(email.threadId);

        try {
            const response = await fetch('/api/integrations/gmail-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessToken,
                    to: email.to,
                    subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                    body: bodyContent,
                    threadId: email.threadId
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to send email');
            }

            // Success!
            notify.success('Email Sent!', `Follow-up sent to ${formatRecipient(email.to)}`);

            // Remove from pending and drafts
            dismissEmail(email.threadId);
            setPendingEmails(prev => prev.filter(e => e.threadId !== email.threadId));
            setGeneratedDrafts(prev => {
                const newDrafts = { ...prev };
                delete newDrafts[email.threadId];
                return newDrafts;
            });

        } catch (err) {
            console.error('Send error:', err);
            notify.error('Send Failed', err.message);
        } finally {
            setSendingEmail(null);
        }
    };

    const handleSendFollowup = async (email, draftContent) => {
        if (onComposeFollowup) {
            onComposeFollowup({
                to: email.to,
                subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                body: draftContent,
                threadId: email.threadId,
                originalEmail: email
            });
        }
    };

    if (loading && pendingEmails.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p style={{ color: '#64748b', marginTop: '1rem' }}>
                    {syncing ? 'Syncing sent emails...' : 'Loading pending follow-ups...'}
                </p>
            </div>
        );
    }

    const inputStyle = {
        width: '50px',
        padding: '0.375rem 0.375rem',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        fontSize: '0.875rem',
        textAlign: 'center'
    };

    const labelStyle = {
        fontSize: '0.75rem',
        color: '#64748b',
        marginLeft: '0.125rem'
    };

    const toggleStyle = (isActive) => ({
        background: isActive ? '#6366f1' : '#e2e8f0',
        color: isActive ? 'white' : '#64748b',
        border: 'none',
        borderRadius: '6px',
        padding: '0.375rem 0.625rem',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        transition: 'all 0.2s'
    });

    return (
        <div>
            {/* Header with settings */}
            <div style={{
                marginBottom: '1.5rem'
            }}>
                {/* Top row */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: 600
                        }}>
                            🤖 AI Assistant
                        </span>
                        {pendingEmails.length > 0 && (
                            <span style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}>
                                {pendingEmails.length} pending
                            </span>
                        )}
                        {syncing && (
                            <span style={{
                                color: '#6366f1',
                                fontSize: '0.75rem'
                            }}>
                                Syncing...
                            </span>
                        )}
                    </div>

                    {/* Toggle buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            style={toggleStyle(autoRefresh)}
                            title="Auto-refresh every 60 seconds"
                        >
                            {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
                        </button>
                        <button
                            onClick={() => setAutoRedraft(!autoRedraft)}
                            style={toggleStyle(autoRedraft)}
                            title="Automatically generate drafts for new pending emails"
                        >
                            {autoRedraft ? '✨ Auto-Draft' : '📝 Manual Draft'}
                        </button>
                    </div>
                </div>

                {/* Threshold row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: '#f8fafc',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    flexWrap: 'wrap'
                }}>
                    <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>
                        Remind after:
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="number"
                            min="0"
                            max="30"
                            value={thresholdDays}
                            onChange={(e) => setThresholdDays(Math.max(0, parseInt(e.target.value) || 0))}
                            style={inputStyle}
                        />
                        <span style={labelStyle}>d</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={thresholdHours}
                            onChange={(e) => setThresholdHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                            style={inputStyle}
                        />
                        <span style={labelStyle}>h</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            value={thresholdMins}
                            onChange={(e) => setThresholdMins(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                            style={inputStyle}
                        />
                        <span style={labelStyle}>m</span>
                    </div>

                    <button
                        onClick={handleThresholdApply}
                        style={{
                            background: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.375rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}
                    >
                        Apply
                    </button>

                    <button
                        onClick={() => loadPendingFollowups(false)}
                        disabled={syncing}
                        style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '0.375rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#6366f1'
                        }}
                    >
                        {syncing ? '...' : '↻'}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Empty state */}
            {pendingEmails.length === 0 && !error && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                    borderRadius: '16px',
                    border: '2px dashed rgba(99, 102, 241, 0.2)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>All caught up!</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        No emails waiting for follow-up beyond {formatThreshold(getTotalThresholdMinutes())}
                    </p>
                </div>
            )}

            {/* Pending emails list */}
            {pendingEmails.length > 0 && (
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
                }}>
                    {pendingEmails.map((email, index) => {
                        const hasDraft = !!generatedDrafts[email.threadId];
                        const isSending = sendingEmail === email.threadId;
                        const isGenerating = draftLoading === email.threadId;

                        return (
                            <div key={email.threadId}>
                                <div
                                    style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: index < pendingEmails.length - 1 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        background: expandedEmail === email.threadId ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
                                    }}
                                    onClick={() => setExpandedEmail(
                                        expandedEmail === email.threadId ? null : email.threadId
                                    )}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    background: '#fef3c7',
                                                    color: '#92400e',
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 600
                                                }}>
                                                    ⏰ {formatTimeSince(email.date)}
                                                </span>
                                                {hasDraft && (
                                                    <span style={{
                                                        background: '#d1fae5',
                                                        color: '#065f46',
                                                        padding: '0.125rem 0.5rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 600
                                                    }}>
                                                        ✨ Draft Ready
                                                    </span>
                                                )}
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: '#0f172a',
                                                    fontSize: '0.9375rem'
                                                }}>
                                                    To: {formatRecipient(email.to)}
                                                </span>
                                            </div>
                                            <div style={{
                                                color: '#334155',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                marginBottom: '0.25rem',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {email.subject || '(No subject)'}
                                            </div>
                                        </div>

                                        {/* Quick action buttons */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                                            {!hasDraft && !isGenerating && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleGenerateDraft(email);
                                                    }}
                                                    style={{
                                                        background: '#8b5cf6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '0.375rem 0.625rem',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    🤖 Draft
                                                </button>
                                            )}
                                            {isGenerating && (
                                                <span style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>⏳...</span>
                                            )}
                                            {hasDraft && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleQuickResend(email);
                                                    }}
                                                    disabled={isSending}
                                                    style={{
                                                        background: isSending ? '#94a3b8' : '#10b981',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '0.375rem 0.625rem',
                                                        cursor: isSending ? 'default' : 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {isSending ? '📤...' : '📧 Send'}
                                                </button>
                                            )}
                                            <span style={{ color: '#94a3b8', fontSize: '1rem' }}>
                                                {expandedEmail === email.threadId ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded section */}
                                {expandedEmail === email.threadId && (
                                    <div style={{
                                        padding: '1rem 1.25rem',
                                        background: 'rgba(99, 102, 241, 0.03)',
                                        borderTop: '1px dashed rgba(99, 102, 241, 0.2)'
                                    }}>
                                        {/* Original email snippet */}
                                        <div style={{
                                            fontSize: '0.8125rem',
                                            color: '#64748b',
                                            marginBottom: '1rem',
                                            padding: '0.75rem',
                                            background: '#f8fafc',
                                            borderRadius: '8px',
                                            borderLeft: '3px solid #e2e8f0'
                                        }}>
                                            <strong>Original:</strong> {email.snippet}
                                        </div>

                                        {/* Action buttons */}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleGenerateDraft(email);
                                                }}
                                                disabled={isGenerating}
                                                className="btn btn-primary"
                                                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                                            >
                                                {isGenerating ? '⏳ Generating...' : hasDraft ? '🔄 Regenerate' : '🤖 Generate Draft'}
                                            </button>

                                            {hasDraft && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleQuickResend(email);
                                                        }}
                                                        disabled={isSending}
                                                        style={{
                                                            background: isSending ? '#94a3b8' : '#10b981',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            padding: '0.5rem 1rem',
                                                            cursor: isSending ? 'default' : 'pointer',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {isSending ? '📤 Sending...' : '📧 One-Click Send'}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSendFollowup(email, generatedDrafts[email.threadId].content);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: '1px solid #6366f1',
                                                            borderRadius: '8px',
                                                            padding: '0.5rem 1rem',
                                                            cursor: 'pointer',
                                                            fontSize: '0.875rem',
                                                            color: '#6366f1',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        ✏️ Edit First
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDismiss(email.threadId);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    padding: '0.5rem 1rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    color: '#64748b'
                                                }}
                                            >
                                                ✕ Dismiss
                                            </button>
                                        </div>

                                        {/* Generated draft preview */}
                                        {hasDraft && (
                                            <div style={{
                                                background: 'white',
                                                borderRadius: '8px',
                                                padding: '1rem',
                                                border: '1px solid rgba(99, 102, 241, 0.3)'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    marginBottom: '0.75rem',
                                                    color: '#6366f1',
                                                    fontWeight: 600,
                                                    fontSize: '0.875rem'
                                                }}>
                                                    ✨ AI Generated Draft
                                                </div>
                                                <div style={{
                                                    whiteSpace: 'pre-wrap',
                                                    color: '#334155',
                                                    fontSize: '0.875rem',
                                                    lineHeight: 1.6
                                                }}>
                                                    {generatedDrafts[email.threadId].content}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
