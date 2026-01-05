export default function IntegrationCard({
    name,
    icon,
    connected,
    connectedEmail,
    loading,
    description,
    lastSync,
    onConnect,
    onDisconnect
}) {
    return (
        <div className="integration-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                    fontSize: '3rem',
                    background: 'linear-gradient(135deg, #7990f3 0%, #9062be 50%, #eef605 100%)',
                    borderRadius: '16px',
                    width: '70px',
                    height: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                        {name}
                    </h3>
                    <span className={connected ? 'status-badge status-connected' : 'status-badge status-disconnected'}>
                        {connected ? (
                            <>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                </svg>
                                Connected
                            </>
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                                Not Connected
                            </>
                        )}
                    </span>
                </div>
            </div>

            <p style={{
                color: '#64748b',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                marginBottom: '1rem'
            }}>
                {description}
            </p>

            {connected && connectedEmail && (
                <p style={{
                    fontSize: '0.8125rem',
                    color: '#10b981',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px'
                }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2zm13 2.383-4.708 2.825L15 11.105V5.383zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741zM1 11.105l4.708-2.897L1 5.383v5.722z" />
                    </svg>
                    {connectedEmail}
                </p>
            )}

            {connected && lastSync && (
                <p style={{
                    fontSize: '0.8125rem',
                    color: '#94a3b8',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                    </svg>
                    Last synced: {lastSync}
                </p>
            )}

            {loading ? (
                <button className="btn btn-primary" disabled style={{ width: '100%', opacity: 0.7 }}>
                    <div className="spinner" style={{
                        width: '20px',
                        height: '20px',
                        borderWidth: '3px',
                        margin: 0
                    }}></div>
                    Connecting...
                </button>
            ) : !connected && onConnect ? (
                <button onClick={onConnect} className="btn btn-primary" style={{ width: '100%' }}>
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z" />
                    </svg>
                    Connect {name}
                </button>
            ) : connected ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                        </svg>
                        Settings
                    </button>
                    {onDisconnect && (
                        <button
                            onClick={onDisconnect}
                            className="btn btn-secondary"
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                            </svg>
                        </button>
                    )}
                </div>
            ) : null}
        </div>
    );
}

