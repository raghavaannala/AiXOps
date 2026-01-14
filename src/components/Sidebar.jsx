import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Sidebar({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [hoveredItem, setHoveredItem] = useState(null);

    const menuItems = [
        { id: 'dashboard', icon: '🏠', label: 'Dashboard', path: '/dashboard' },
        { id: 'integrations', icon: '🔗', label: 'Integrations', path: '/integrations' },
        { id: 'automations', icon: '⚡', label: 'Automations', path: '/automations' },
        { id: 'settings', icon: '⚙️', label: 'Settings', path: '/settings' }
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <aside style={{
            width: '240px',
            minHeight: '100vh',
            background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem 0',
            position: 'fixed',
            left: 0,
            top: 0,
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)'
        }}>
            {/* Logo */}
            <div style={{
                padding: '0 1.5rem 2rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                    }}>
                        ⚡
                    </div>
                    <span style={{
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        letterSpacing: '-0.5px'
                    }}>
                        AiOps
                    </span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav style={{
                flex: 1,
                padding: '1.5rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
            }}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.875rem',
                            padding: '0.875rem 1rem',
                            background: isActive(item.path)
                                ? 'linear-gradient(90deg, rgba(79, 172, 254, 0.3) 0%, transparent 100%)'
                                : hoveredItem === item.id
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : 'transparent',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderLeft: isActive(item.path)
                                ? '3px solid #4facfe'
                                : '3px solid transparent'
                        }}
                    >
                        <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                        <span style={{
                            color: isActive(item.path) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.9375rem',
                            fontWeight: isActive(item.path) ? 600 : 500
                        }}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>

            {/* Logout Button */}
            <div style={{ padding: '0 0.75rem' }}>
                <button
                    onClick={handleLogout}
                    onMouseEnter={() => setHoveredItem('logout')}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.875rem',
                        padding: '0.875rem 1rem',
                        background: hoveredItem === 'logout'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : 'transparent',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>←</span>
                    <span style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '0.9375rem',
                        fontWeight: 500
                    }}>
                        Log Out
                    </span>
                </button>
            </div>
        </aside>
    );
}
