import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #cbd5e1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Terrapin Events
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '3rem' }}>
                Campus Event Management System
            </p>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div
                    className="glass-panel"
                    style={{ padding: '2rem', width: '250px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => navigate('/auth/student')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                    <h3>Student</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Browse and register for campus events.</p>
                </div>

                <div
                    className="glass-panel"
                    style={{ padding: '2rem', width: '250px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => navigate('/auth/organizer')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                    <h3>Organizer</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Create and manage your events.</p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
