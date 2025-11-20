import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ username: '', role: '' });


    // Helper to get cookie value
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    useEffect(() => {
        const token = getCookie('token');
        const role = getCookie('role');
        if (!token) {
            navigate('/');
        } else {
            setUser({ username: 'User', role: role || 'Guest' });
        }
    }, [navigate]);


    const handleLogout = () => {
        document.cookie = 'token=; Max-Age=0; path=/;';
        document.cookie = 'role=; Max-Age=0; path=/;';
        navigate('/');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem'
        }}>
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
                <h1 style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>Welcome, {user.role}!</h1>
                <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '2rem' }}>
                    You have successfully authenticated with the User Authentication Service.
                </p>

                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                    <p style={{ margin: '0.5rem 0' }}><strong>Status:</strong> Authenticated ✅</p>
                    <p style={{ margin: '0.5rem 0' }}><strong>Database:</strong> PostgreSQL (NeonDB) 🐘</p>
                </div>

                <button onClick={handleLogout} className="btn-primary" style={{ background: '#ef4444' }}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
