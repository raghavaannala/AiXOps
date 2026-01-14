export function IntegrationCard({
    icon,
    name,
    connected,
    email,
    username,
    onConnect,
    onRevoke
}) {
    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                    <span style={{
                        fontSize: '1.125rem',
                        fontWeight: 600,
                        color: '#0f172a'
                    }}>
                        {name} Connected
                    </span>
                </div>
                {connected && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>
                        <span style={{ color: '#10b981', fontSize: '1rem' }}>●</span>
                    </div>
                )}
            </div>

            {/* Account info */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
                color: '#64748b',
                fontSize: '0.9375rem'
            }}>
                <span>✉️</span>
                <span>{email || username || 'Not connected'}</span>
            </div>

            {/* Actions */}
            {connected ? (
                <button
                    onClick={onRevoke}
                    style={{
                        padding: '0.625rem 1.25rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: '#334155',
                        transition: 'all 0.2s'
                    }}
                >
                    Revoke Access
                </button>
            ) : (
                <button
                    onClick={onConnect}
                    style={{
                        padding: '0.625rem 1.25rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'all 0.2s'
                    }}
                >
                    Connect
                </button>
            )}
        </div>
    );
}

export function AutomationCard({
    icon,
    title,
    description,
    active,
    nextRun,
    onToggle,
    onSettings
}) {
    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                    <div>
                        <div style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#0f172a'
                        }}>
                            {title}
                        </div>
                        {active && (
                            <span style={{
                                fontSize: '0.75rem',
                                color: '#10b981',
                                fontWeight: 600
                            }}>
                                Active
                            </span>
                        )}
                    </div>
                </div>

                {/* Toggle */}
                <button
                    onClick={onToggle}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.375rem 0.75rem',
                        background: active
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : '#e2e8f0',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: active ? 'white' : '#64748b'
                    }}
                >
                    {active && <span>✓</span>}
                    ON
                </button>
            </div>

            {/* Description */}
            <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                marginBottom: '1rem',
                lineHeight: 1.5
            }}>
                {description}
            </p>

            {/* Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {nextRun && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.8125rem',
                        color: '#94a3b8'
                    }}>
                        <span>⏰</span>
                        <span>{nextRun}</span>
                    </div>
                )}
                <button
                    onClick={onSettings}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'white'
                    }}
                >
                    Edit Settings
                </button>
            </div>
        </div>
    );
}

export function FeatureCard({
    icon,
    title,
    description,
    enabled,
    onEnable,
    actionLabel
}) {
    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
        }}>
            {/* Icon */}
            <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                flexShrink: 0
            }}>
                {icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    marginBottom: '0.375rem'
                }}>
                    {title}
                </h3>
                <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: 0
                }}>
                    {description}
                </p>
            </div>

            {/* Action */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.5rem'
            }}>
                <button
                    onClick={onEnable}
                    style={{
                        padding: '0.625rem 1.25rem',
                        background: enabled
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: 'white'
                    }}
                >
                    {enabled ? 'Enabled' : 'Enable'}
                </button>
                {actionLabel && (
                    <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.75rem',
                        color: '#10b981'
                    }}>
                        <span>●</span>
                        {actionLabel}
                    </span>
                )}
            </div>
        </div>
    );
}
