import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GitHubCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');

        if (code) {
            // Send code to backend
            fetch(`/api/auth/github?code=${code}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        navigate('/dashboard?connected=github');
                    } else {
                        navigate('/dashboard?error=github');
                    }
                })
                .catch(err => {
                    console.error('GitHub auth error:', err);
                    navigate('/dashboard?error=github');
                });
        } else {
            navigate('/dashboard');
        }
    }, [searchParams, navigate]);

    return (
        <div className="loading">
            <div>Connecting your GitHub account...</div>
            <div style={{ marginTop: '1rem', fontSize: '1rem' }}>Please wait</div>
        </div>
    );
}
