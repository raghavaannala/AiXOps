export default function AutomationCard({ automation, onToggle }) {
    const getAutomationDetails = (type, config) => {
        switch (type) {
            case 'email_followup':
                return {
                    title: 'Email Follow-up',
                    icon: '📧',
                    description: 'Automatically send follow-up emails when no reply is received',
                    settings: [
                        `Follow-up after ${config.delay_hours} hours`,
                        `Maximum ${config.max_followups} follow-ups per thread`
                    ],
                    color: '#6366f1'
                };
            case 'github_reminder':
                return {
                    title: 'GitHub Reminders',
                    icon: '🐙',
                    description: 'Get reminders for open PRs and pending commits',
                    settings: [
                        `Remind after ${config.remind_after_hours} hours`,
                        config.track_prs ? 'Tracking pull requests' : 'Not tracking PRs'
                    ],
                    color: '#8b5cf6'
                };
            default:
                return {
                    title: 'Unknown',
                    icon: '❓',
                    description: '',
                    settings: [],
                    color: '#64748b'
                };
        }
    };

    const details = getAutomationDetails(automation.type, automation.config);

    return (
        <div className="automation-card" style={{
            opacity: automation.enabled ? 1 : 0.7,
            borderColor: automation.enabled ? `${details.color}30` : 'rgba(203, 213, 225, 0.3)'
        }}>
            <div style={{
                fontSize: '3rem',
                background: automation.enabled
                    ? `linear-gradient(135deg, ${details.color}20 0%, ${details.color}10 100%)`
                    : '#f1f5f9',
                borderRadius: '16px',
                width: '70px',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.3s ease'
            }}>
                {details.icon}
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
                        {details.title}
                    </h3>
                    {automation.enabled && (
                        <span style={{
                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                            color: '#065f46',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Active
                        </span>
                    )}
                </div>

                <p style={{
                    color: '#64748b',
                    fontSize: '0.9375rem',
                    marginBottom: '0.75rem',
                    lineHeight: 1.5
                }}>
                    {details.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {details.settings.map((setting, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: '#94a3b8',
                            fontSize: '0.875rem'
                        }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z" />
                            </svg>
                            {setting}
                        </div>
                    ))}
                </div>
            </div>

            <div
                className={`toggle-switch ${automation.enabled ? 'active' : ''}`}
                onClick={() => onToggle(!automation.enabled)}
                style={{ flexShrink: 0 }}
            />
        </div>
    );
}
