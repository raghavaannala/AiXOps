import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import IntegrationCard from '../components/IntegrationCard';
import AutomationCard from '../components/AutomationCard';
import ActivityItem from '../components/ActivityItem';
import {
    getGmailConnection,
    startGmailAuth,
    disconnectGmail,
    testGmailConnection
} from '../gmailUtils';

export default function Dashboard({ user }) {
    const [integrations, setIntegrations] = useState({ gmail: false, github: false });
    const [gmailEmail, setGmailEmail] = useState(null);
    const [gmailLoading, setGmailLoading] = useState(false);
    const [automations, setAutomations] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ emailsTracked: 0, prsMonitored: 0 });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Check Gmail connection status
            const gmailConnection = getGmailConnection();
            if (gmailConnection?.connected) {
                setIntegrations(prev => ({ ...prev, gmail: true }));
                setGmailEmail(gmailConnection.email);

                // Test if connection is still valid
                try {
                    await testGmailConnection();
                } catch (err) {
                    console.error('Gmail connection test failed:', err);
                    // Connection expired or invalid
                    setIntegrations(prev => ({ ...prev, gmail: false }));
                    setGmailEmail(null);
                }
            }

            setAutomations([]);
            setActivities([]);
            setStats({ emailsTracked: 0, prsMonitored: 0 });
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleConnectGmail = async () => {
        setGmailLoading(true);
        try {
            await startGmailAuth(user.uid);
            // Will redirect to Google OAuth
        } catch (error) {
            console.error('Gmail connect error:', error);
            alert('Failed to start Gmail connection: ' + error.message);
            setGmailLoading(false);
        }
    };

    const handleDisconnectGmail = () => {
        disconnectGmail();
        setIntegrations(prev => ({ ...prev, gmail: false }));
        setGmailEmail(null);
    };

    const handleConnectGitHub = () => {
        // TODO: Implement GitHub OAuth
        alert('GitHub integration coming soon!');
    };

    const toggleAutomation = async (id, enabled) => {
        try {
            // TODO: Call backend API
            setAutomations(prev =>
                prev.map(auto => auto.id === id ? { ...auto, enabled } : auto)
            );
        } catch (error) {
            console.error('Failed to toggle automation:', error);
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <div>Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Header */}
            <div className="header">
                <div>
                    <h1 className="header-title" style={{ margin: 0 }}>
                        Welcome To AiOps
                    </h1>
                    <p className="header-subtitle">
                        Welcome back, {user?.displayName || user?.email?.split('@')[0]}! 👋
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {user?.photoURL && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.25)',
                            backdropFilter: 'blur(10px)',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            color: 'white',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                        }}>
                            <img
                                src={user.photoURL}
                                alt="Profile"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: '2px solid white'
                                }}
                            />
                            <span style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
                                {user.email}
                            </span>
                        </div>
                    )}
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                <StatCard
                    icon="📧"
                    label="Emails Tracked"
                    value={stats.emailsTracked}
                    color="#1a1aafff"
                />
                <StatCard
                    icon="🐙"
                    label="PRs Monitored"
                    value={stats.prsMonitored}
                    color="#331b95ff"
                />
            </div>

            {/* Integrations Section */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Integrations</h2>
                        <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                            Connect your accounts to enable automations
                        </p>
                    </div>
                </div>

                <div className="grid grid-2">
                    <IntegrationCard
                        name="Gmail"
                        icon="📧"
                        connected={integrations.gmail}
                        connectedEmail={gmailEmail}
                        loading={gmailLoading}
                        description="Send automated follow-up emails when no reply is received"
                        onConnect={handleConnectGmail}
                        onDisconnect={handleDisconnectGmail}
                    />

                    <IntegrationCard
                        name="GitHub"
                        icon="🐙"
                        connected={integrations.github}
                        description="Track PRs and commits with intelligent reminders"
                        onConnect={handleConnectGitHub}
                    />
                </div>
            </div>

            {/* Automations Section */}
            {automations.length > 0 && (
                <div className="card">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0 }}>Automations</h2>
                        <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                            Configure your automated workflows
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {automations.map(automation => (
                            <AutomationCard
                                key={automation.id}
                                automation={automation}
                                onToggle={(enabled) => toggleAutomation(automation.id, enabled)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Activity Section */}
            <div className="card">
                <div style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Recent Activity</h2>
                    <p style={{ color: '#64748b', marginTop: '0.5rem', marginBottom: 0 }}>
                        Your automation history
                    </p>
                </div>

                {activities.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activities.map(activity => (
                            <ActivityItem key={activity.id} activity={activity} />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                        borderRadius: '16px',
                        border: '2px dashed rgba(99, 102, 241, 0.2)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                        <h3 style={{ color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>No activity yet</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9375rem', margin: 0 }}>
                            Connect your accounts and enable automations to get started!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="card" style={{
            background: `rgba(254, 253, 253, 0.95)`,
            border: `2px solid ${color}30`,
            padding: '2rem'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                    </p>
                    <h3 style={{ fontSize: '3rem', fontWeight: 800, margin: 0, color: color }}>
                        {value}
                    </h3>
                    {value > 0 && (
                        <p style={{
                            color: '#94a3b8',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            marginTop: '0.5rem',
                            marginBottom: 0
                        }}>
                            Total tracked
                        </p>
                    )}
                </div>
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
            </div>
        </div>
    );
}
