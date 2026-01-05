export default function ActivityItem({ activity }) {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'email': return '📧';
            case 'github': return '🐙';
            default: return '📌';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return '#10b981';
            case 'error': return '#ef4444';
            case 'info': return '#6366f1';
            default: return '#64748b';
        }
    };

    const statusColor = getStatusColor(activity.status);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            transition: 'all 0.3s ease'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 100%)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.2) 100%)';
            }}
        >
            <div style={{
                fontSize: '2rem',
                width: '50px',
                height: '50px',
                background: `${statusColor}15`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {getActivityIcon(activity.type)}
            </div>

            <div style={{ flex: 1 }}>
                <p style={{
                    margin: 0,
                    fontWeight: 600,
                    color: '#0f172a',
                    fontSize: '0.9375rem',
                    marginBottom: '0.25rem'
                }}>
                    {activity.message}
                </p>
                <p style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                    </svg>
                    {activity.time}
                </p>
            </div>

            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: statusColor,
                boxShadow: `0 0 10px ${statusColor}50`,
                flexShrink: 0
            }} />
        </div>
    );
}
