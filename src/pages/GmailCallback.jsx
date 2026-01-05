import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';

export default function GmailCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Connecting your Gmail account...');
    const [error, setError] = useState(null);

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const errorParam = searchParams.get('error');

        if (errorParam) {
            setError(`Gmail authorization failed: ${errorParam}`);
            setTimeout(() => navigate('/dashboard'), 3000);
            return;
        }

        if (!code) {
            setError('No authorization code received');
            setTimeout(() => navigate('/dashboard'), 3000);
            return;
        }

        handleCallback(code, state);
    }, [searchParams, navigate]);

    const handleCallback = async (code, state) => {
        try {
            setStatus('Exchanging authorization code...');

            const response = await fetch('/api/integrations/gmail-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, state })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to complete Gmail authorization');
            }

            setStatus('Gmail connected successfully!');

            // Store Gmail tokens in localStorage
            const gmailConnection = {
                connected: true,
                email: data.email,
                accessToken: data.tokens.accessToken,
                refreshToken: data.tokens.refreshToken,
                expiresAt: data.tokens.expiresAt,
                connectedAt: Date.now()
            };
            localStorage.setItem('gmail_connection', JSON.stringify(gmailConnection));

            // Redirect to dashboard after short delay
            setTimeout(() => navigate('/dashboard'), 1500);

        } catch (err) {
            console.error('Gmail callback error:', err);
            setError(err.message);
            setTimeout(() => navigate('/dashboard'), 3000);
        }
    };

    return (
        <div className="loading">
            {error ? (
                <>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                    <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Redirecting to dashboard...
                    </div>
                </>
            ) : (
                <>
                    <div className="spinner"></div>
                    <div>{status}</div>
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                        Please wait...
                    </div>
                </>
            )}
        </div>
    );
}
