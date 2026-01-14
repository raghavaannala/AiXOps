import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GmailCallback from './pages/GmailCallback';
import { NotificationProvider } from './components/Notifications';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
                <div>Loading your workspace...</div>
            </div>
        );
    }

    return (
        <NotificationProvider>
            <Router>
                <Routes>
                    <Route
                        path="/"
                        element={user ? <Navigate to="/dashboard" /> : <Login />}
                    />
                    <Route
                        path="/dashboard"
                        element={user ? <Dashboard user={user} /> : <Navigate to="/" />}
                    />
                    <Route
                        path="/auth/gmail/callback"
                        element={user ? <GmailCallback /> : <Navigate to="/" />}
                    />
                </Routes>
            </Router>
        </NotificationProvider>
    );
}

export default App;


