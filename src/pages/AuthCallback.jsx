import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback({ setUser }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            // Send code to backend
            fetch(`/api/auth/google?code=${code}`)
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        setUser(data.user);
                        navigate('/dashboard');
                    } else {
                        navigate('/');
                    }
                })
                .catch(err => {
                    console.error('Auth error:', err);
                    navigate('/');
                });
        } else {
            navigate('/');
        }
    }, [searchParams, navigate, setUser]);

    return (
        <div className="loading">
            <div>Connecting your Gmail account...</div>
            <div style={{ marginTop: '1rem', fontSize: '1rem' }}>Please wait</div>
        </div>
    );
}
