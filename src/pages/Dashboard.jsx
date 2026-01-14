import { useState, useEffect } from 'react';
import { getGmailConnection, startGmailAuth, disconnectGmail, getValidAccessToken } from '../gmailUtils';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { IntegrationCard, AutomationCard, FeatureCard } from '../components/Cards';
import AIAssistant from '../components/AIAssistant';
import EmailComposer from '../components/EmailComposer';
import EmailInbox from '../components/EmailInbox';
import { useNotification } from '../components/Notifications';
import NotificationBanner from '../components/NotificationBanner';

export default function Dashboard({ user }) {
    const notify = useNotification();
    const [loading, setLoading] = useState(true);
    const [gmailConnected, setGmailConnected] = useState(false);
    const [gmailEmail, setGmailEmail] = useState(null);
    const [gmailAccessToken, setGmailAccessToken] = useState(null);
    const [githubConnected, setGithubConnected] = useState(false);
    const [composerData, setComposerData] = useState(null);
    const [showActivity, setShowActivity] = useState(false);

    // Automation states
    const [gmailAutomationActive, setGmailAutomationActive] = useState(true);
    const [githubAutomationActive, setGithubAutomationActive] = useState(true);
    const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(false);

    useEffect(() => {
        initializeData();
        // Request notification permission on load
        notify.requestPermission();
    }, []);

    const initializeData = async () => {
        try {
            // Check Gmail connection
            const connection = getGmailConnection();
            const connected = !!connection?.accessToken;
            setGmailConnected(connected);

            if (connected) {
                setGmailEmail(connection.email);
                try {
                    const token = await getValidAccessToken();
                    setGmailAccessToken(token);
                } catch (err) {
                    console.error('Token refresh failed:', err);
                    setGmailAccessToken(connection.accessToken);
                }
            }
        } catch (error) {
            console.error('Init error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGmail = () => {
        startGmailAuth(user?.uid);
    };

    const handleDisconnectGmail = () => {
        disconnectGmail();
        setGmailConnected(false);
        setGmailEmail(null);
        setGmailAccessToken(null);
        notify.info('Disconnected', 'Gmail access revoked');
    };

    const handleConnectGitHub = () => {
        notify.info('Coming Soon', 'GitHub integration is under development');
    };

    const handleComposeFollowup = (data) => {
        setComposerData(data);
    };

    const handleEmailSent = () => {
        setComposerData(null);
        notify.success('Email Sent!', 'Your follow-up was sent successfully', {
            onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' })
        });
    };

    // Calculate next run time based on current time
    const getNextRunTime = (intervalHours = 1) => {
        const now = new Date();
        const next = new Date(now.getTime() + intervalHours * 60 * 60 * 1000);
        const hours = next.getHours();
        const minutes = next.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours % 12 || 12;
        const displayMin = minutes.toString().padStart(2, '0');

        if (intervalHours < 1) {
            return `In ${Math.round(intervalHours * 60)} min at ${displayHour}:${displayMin} ${ampm}`;
        }
        return `In ${intervalHours}h at ${displayHour}:${displayMin} ${ampm}`;
    };

    // Get day/time for weekly runs
    const getNextWeeklyRun = () => {
        const now = new Date();
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
        nextMonday.setHours(9, 0, 0, 0);

        const daysUntil = Math.ceil((nextMonday - now) / (1000 * 60 * 60 * 24));
        return daysUntil === 1 ? 'Tomorrow at 9:00 AM' : `In ${daysUntil} days (Monday 9:00 AM)`;
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <div>Loading your workspace...</div>
            </div>
        );
    }

    const userName = user?.displayName?.split(' ')[0] || 'there';

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
            {/* Sidebar */}
            <Sidebar user={user} />

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: '240px',
                padding: '1.5rem 2rem'
            }}>
                {/* Header */}
                <Header user={user} onViewActivity={() => setShowActivity(!showActivity)} />

                {/* Welcome Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        marginBottom: '0.5rem'
                    }}>
                        Welcome, {userName}! 👋
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: '#64748b'
                    }}>
                        Automate your dev workflows with smart follow-ups and reminders.
                    </p>
                </div>

                {/* Notification Permission Banner */}
                <NotificationBanner userId={user?.uid} />

                {/* Integration Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <IntegrationCard
                        icon="📧"
                        name="Gmail"
                        connected={gmailConnected}
                        email={gmailEmail}
                        onConnect={handleConnectGmail}
                        onRevoke={handleDisconnectGmail}
                    />
                    <IntegrationCard
                        icon="🐙"
                        name="GitHub"
                        connected={githubConnected}
                        username={githubConnected ? 'annaDev' : null}
                        onConnect={handleConnectGitHub}
                        onRevoke={() => setGithubConnected(false)}
                    />
                </div>

                {/* Automation Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <AutomationCard
                        icon="📧"
                        title="Gmail Follow-Up Automation"
                        description="Automatically draft follow-ups for emails with no reply after 2 days"
                        active={gmailAutomationActive && gmailConnected}
                        nextRun={gmailAutomationActive && gmailConnected ? getNextRunTime(1) : 'Disabled'}
                        onToggle={() => {
                            setGmailAutomationActive(!gmailAutomationActive);
                            notify.info(
                                gmailAutomationActive ? 'Automation Paused' : 'Automation Enabled',
                                gmailAutomationActive ? 'Follow-up automation is now disabled' : 'Follow-up automation will check every hour'
                            );
                        }}
                        onSettings={() => notify.info('Settings', 'Opening automation settings...', {
                            onClick: () => window.location.href = '/settings'
                        })}
                    />
                    <AutomationCard
                        icon="🔔"
                        title="GitHub PR Reminder Automation"
                        description="Send reminders for open PRs pending review after 3 days without activity"
                        active={githubAutomationActive && githubConnected}
                        nextRun={githubAutomationActive && githubConnected ? getNextRunTime(2) : 'Disabled'}
                        onToggle={() => {
                            setGithubAutomationActive(!githubAutomationActive);
                            notify.info(
                                githubAutomationActive ? 'Automation Paused' : 'Automation Enabled',
                                githubAutomationActive ? 'PR reminder automation is now disabled' : 'PR reminders will check every 2 hours'
                            );
                        }}
                        onSettings={() => notify.info('Settings', 'Opening automation settings...', {
                            onClick: () => window.location.href = '/settings'
                        })}
                    />
                </div>

                {/* Weekly Summary Feature */}
                <FeatureCard
                    icon="📊"
                    title="Weekly GitHub Summary"
                    description="Get a weekly summary of your GitHub activities sent to your email inbox every Monday at 9:00"
                    enabled={weeklyDigestEnabled}
                    onEnable={() => setWeeklyDigestEnabled(!weeklyDigestEnabled)}
                    actionLabel={weeklyDigestEnabled ? "Draft Summary & Send Email" : null}
                />
                {/* AI Assistant Section - Only show when Gmail connected */}
                {gmailConnected && gmailAccessToken && (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        marginTop: '2rem',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#0f172a',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            🤖 AI Follow-up Assistant
                        </h2>
                        <AIAssistant
                            accessToken={gmailAccessToken}
                            onComposeFollowup={handleComposeFollowup}
                        />
                    </div>
                )}

                {/* Email Composer Modal */}
                {composerData && (
                    <EmailComposer
                        initialTo={composerData.to}
                        initialSubject={composerData.subject}
                        initialBody={composerData.body}
                        threadId={composerData.threadId}
                        accessToken={gmailAccessToken}
                        onSend={handleEmailSent}
                        onCancel={() => setComposerData(null)}
                        onRegenerate={() => { }}
                    />
                )}

                {/* Email Inbox - Shows when Gmail connected */}
                {gmailConnected && gmailAccessToken && (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        marginTop: '2rem',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)'
                    }}>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#0f172a',
                            marginBottom: '1rem'
                        }}>
                            📬 Recent Emails
                        </h2>
                        <EmailInbox accessToken={gmailAccessToken} />
                    </div>
                )}


            </main>

        </div>
    );
}
