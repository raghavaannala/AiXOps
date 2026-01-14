import { useState } from 'react';

export default function Header({ user, onViewActivity }) {
    const [searchQuery, setSearchQuery] = useState('');
    const activityCount = 3; // TODO: Make dynamic

    return (
        <header style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 2rem',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            marginBottom: '2rem'
        }}>
            {/* Search Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '0.625rem 1rem',
                flex: 1,
                maxWidth: '400px'
            }}>
                <span style={{ color: '#94a3b8', marginRight: '0.75rem' }}>🔍</span>
                <input
                    type="text"
                    placeholder="Search every where..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: '0.9375rem',
                        color: '#334155',
                        width: '100%'
                    }}
                />
            </div>

            {/* Right side actions */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                {/* Notifications */}
                <button style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    position: 'relative',
                    padding: '0.5rem'
                }}>
                    🔔
                </button>

                {/* View Activity */}
                <button
                    onClick={onViewActivity}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1rem',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: '#334155'
                    }}
                >
                    View Activity
                    {activityCount > 0 && (
                        <span style={{
                            background: '#3b82f6',
                            color: 'white',
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '10px',
                            fontWeight: 600
                        }}>
                            {activityCount}
                        </span>
                    )}
                </button>

                {/* User Avatar */}
                <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid #e2e8f0',
                    cursor: 'pointer'
                }}>
                    {user?.photoURL ? (
                        <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 600
                        }}>
                            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
