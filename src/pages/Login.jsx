import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useState } from 'react';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithPopup(auth, googleProvider);
            // User will be automatically redirected by App.jsx's auth state listener
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Failed to sign in. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh'
        }}>
            <div className="card" style={{
                maxWidth: '600px',
                textAlign: 'center',
                animation: 'fadeInUp 0.8s ease-out'
            }}>
                {/* Logo/Icon */}
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    ⚡
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Automation SaaS
                </h1>

                <p style={{
                    fontSize: '1.25rem',
                    color: '#64748b',
                    marginBottom: '3rem',
                    fontWeight: 500
                }}>
                    Automate your workflow with intelligent email follow-ups and GitHub reminders
                </p>

                {/* Features Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1.5rem',
                    marginBottom: '3rem',
                    textAlign: 'left'
                }}>
                    <FeatureItem
                        icon="📧"
                        title="Smart Follow-ups"
                        description="Auto-send emails when no reply"
                    />
                    <FeatureItem
                        icon="🐙"
                        title="GitHub Tracking"
                        description="Never miss a PR or commit"
                    />
                    <FeatureItem
                        icon="⏰"
                        title="24/7 Automation"
                        description="Works even when you're offline"
                    />
                    <FeatureItem
                        icon="🤖"
                        title="AI-Powered"
                        description="Smart message formatting"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        color: '#991b1b',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600
                    }}>
                        {error}
                    </div>
                )}

                {/* Sign In Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                        width: '100%',
                        fontSize: '1.125rem',
                        padding: '1.25rem 2rem',
                        position: 'relative'
                    }}
                >
                    {loading ? (
                        <>
                            <div className="spinner" style={{
                                width: '20px',
                                height: '20px',
                                borderWidth: '3px',
                                margin: 0
                            }}></div>
                            Signing in...
                        </>
                    ) : (
                        <>
                            <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'relative', zIndex: 1 }}>
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            <span style={{ position: 'relative', zIndex: 1 }}>Continue with Google</span>
                        </>
                    )}
                </button>

                {/* Footer */}
                <p style={{
                    marginTop: '2rem',
                    fontSize: '0.875rem',
                    color: '#94a3b8'
                }}>
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}

function FeatureItem({ icon, title, description }) {
    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            transition: 'all 0.3s ease'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
            <h4 style={{
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: '#0f172a'
            }}>
                {title}
            </h4>
            <p style={{
                fontSize: '0.875rem',
                color: '#64748b',
                margin: 0,
                lineHeight: 1.5
            }}>
                {description}
            </p>
        </div>
    );
}
