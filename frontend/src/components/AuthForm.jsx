import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8000';

function AuthForm({ role }) {
    // Admin can only login, not sign up
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const [notification, setNotification] = useState('');

    // Show notification from sessionStorage after redirect (for sign in)
    useEffect(() => {
        const notif = window.sessionStorage.getItem('auth_notification');
        if (notif) {
            setNotification(notif);
            setTimeout(() => setNotification(''), 2500);
            window.sessionStorage.removeItem('auth_notification');
        }
    }, []);

    // Show notification from sessionStorage after redirect (for sign in)
    useEffect(() => {
        const notif = window.sessionStorage.getItem('auth_notification');
        if (notif) {
            setNotification(notif);
            setTimeout(() => setNotification(''), 2500);
            window.sessionStorage.removeItem('auth_notification');
        }
    }, []);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!isLogin) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
            if (!passwordRegex.test(password)) {
                setError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)");
                return;
            }
        }

        if (isLogin) {
            // Send login data to backend
            try {
                const payload = {
                    email,
                    password,
                    role
                };
                const response = await axios.post(`${AUTH_SERVICE_URL}/api/users/login`, payload);
                if (response.status === 200 && response.data.access_token) {
                    document.cookie = `token=${response.data.access_token}; path=/;`; // Store JWT in cookie
                    document.cookie = `role=${response.data.role}; path=/;`;
                    document.cookie = `username=${response.data.username}; path=/;`;
                    document.cookie = `user_id=${response.data.user_id}; path=/;`;
                    // Store notification in sessionStorage so it persists after navigation
                    window.sessionStorage.setItem('auth_notification', `Logged in as ${response.data.role}`);
                    navigate('/events');
                } else {
                    setError('Invalid credentials');
                }
            } catch (err) {
                setError(err.response?.data?.detail || 'Login error');
            }
        } else {
            // Send signup data to backend
            try {
                const payload = {
                    email,
                    phone,
                    address,
                    password,
                    role
                };
                const response = await axios.post(`${AUTH_SERVICE_URL}/api/users/register`, payload);
                if (response.status === 200) {
                    setNotification('Registration successful! Please login with your new account.');
                    setTimeout(() => setNotification(''), 2500);
                    setIsLogin(true);
                } else {
                    setError('Registration failed');
                }
            } catch (err) {
                setError(err.response?.data?.detail || 'Registration error');
            }
        }
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '100%', margin: '0 auto', position: 'relative' }}>
            {notification && (
                <div style={{
                    position: 'absolute',
                    top: '-2.5rem',
                    left: 0,
                    right: 0,
                    margin: '0 auto',
                    background: '#22c55e',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 10
                }}>
                    {notification}
                </div>
            )}

            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                {role.charAt(0).toUpperCase() + role.slice(1)} {isLogin ? 'Login' : 'Sign Up'}
            </h2>

            {error && (
                <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>
                    {error}
                    <br />
                    <button
                        style={{ marginTop: '0.5rem', background: '#1976d2', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                        onClick={() => navigate('/')}
                    >
                        Go Back to Home
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                    <input
                        type="email"
                        className="input-field"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {!isLogin && (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Phone</label>
                            <input
                                type="tel"
                                className="input-field"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Address</label>
                            <textarea
                                className="input-field"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                style={{ resize: 'vertical', minHeight: '60px' }}
                            />
                        </div>
                    </>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                    <input
                        type="password"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {!isLogin && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                    {isLogin ? 'Login' : 'Sign Up'}
                </button>
            </form>

            {/* Hide signup toggle for admin */}
            {role !== 'admin' && (
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AuthForm;
