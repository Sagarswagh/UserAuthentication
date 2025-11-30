import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import OrganizerEvents from './OrganiseEvents';

const rawEventsBase = import.meta.env.VITE_EVENTS_API_BASE || 'http://localhost:8001/events';
const EVENTS_API_BASE = rawEventsBase.endsWith('/events') ? rawEventsBase : rawEventsBase.replace(/\/$/, '') + '/events';

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Remove duplicate StudentEvents and old Events component. Only keep the unified Events component and EventsList.

// Unified Events List (for both roles)
const EventsList = ({ token, showRegister, onRegister, events, loading, error, showEdit, onEdit }) => {
    return (
        <div style={{ padding: '2rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '1rem' }}>All Events</h1>
                {loading && <p>Loading events...</p>}
                {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {events.map((ev) => (
                        <div key={ev.event_id} className="glass-panel" style={{ padding: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{ev.event_name}</h3>
                            <p style={{ color: '#94a3b8', margin: '0.5rem 0' }}>{ev.location || 'Location TBD'}</p>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                                <strong>Start:</strong> {new Date(ev.start_time).toLocaleString()}
                            </p>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                                <strong>End:</strong> {new Date(ev.end_time).toLocaleString()}
                            </p>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                                <strong>Remaining Seats:</strong> {ev.remaining_seats}
                            </p>
                            {showRegister && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => onRegister(ev.event_id)}
                                        disabled={ev.remaining_seats <= 0}
                                    >
                                        {ev.remaining_seats > 0 ? 'Register' : 'Full'}
                                    </button>
                                </div>
                            )}
                            {showEdit && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => onEdit(ev)}
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Events = () => {
    const navigate = useNavigate();
    const token = getCookie('token');
    const role = (getCookie('role') || '').toLowerCase();
    const username = getCookie('username') || '';
    const userId = getCookie('user_id') || '';
    const [notification, setNotification] = useState('');
    const [tab, setTab] = useState('all'); // 'all' | 'create' | 'manage'
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [myEvents, setMyEvents] = useState([]);

    // For create event modal/section
    const [showCreate, setShowCreate] = useState(false);

    // For editing events
    const [editingEvent, setEditingEvent] = useState(null);
    const [editForm, setEditForm] = useState({
        event_name: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location: '',
        remaining_seats: 0,
    });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        if (!token) navigate('/');
        // Show notification from sessionStorage after redirect (for sign in)
        const notif = window.sessionStorage.getItem('auth_notification');
        if (notif) {
            setNotification(notif);
            setTimeout(() => setNotification(''), 2500);
            window.sessionStorage.removeItem('auth_notification');
        }
        fetchAllEvents();
    }, [token, navigate]);

    // Fetch all events
    const fetchAllEvents = async () => {
        try {
            setLoading(true);
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(EVENTS_API_BASE, { headers });
            setEvents(res.data || []);
            if (role === 'organizer' && userId) {
                setMyEvents((res.data || []).filter(ev => ev.organizer_id && ev.organizer_id.toLowerCase() === userId.toLowerCase()));
            }
            setError('');
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    // Register handler
    const handleRegister = async (eventId) => {
        try {
            const url = `${EVENTS_API_BASE}/${eventId}/register`;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post(url, {}, { headers });
            if (res.status === 200 || res.status === 201) {
                setNotification('Successfully registered for the event');
                setTimeout(() => setNotification(''), 2500);
                fetchAllEvents();
            } else {
                setNotification('Registration response: ' + res.statusText);
            }
        } catch (err) {
            setNotification(err.response?.data?.detail || 'Failed to register.');
        }
    };

    // Helper to convert ISO datetime to date and time inputs
    const toDateAndTime = (iso) => {
        if (!iso) return { date: '', time: '' };
        const d = new Date(iso);
        if (isNaN(d.getTime())) return { date: '', time: '' };
        const date = d.toISOString().slice(0, 10);
        const time = d.toTimeString().slice(0, 5);
        return { date, time };
    };

    // Start editing an event
    const handleEditEvent = (ev) => {
        setEditingEvent(ev);
        const s = toDateAndTime(ev.start_time);
        const e = toDateAndTime(ev.end_time);
        setEditForm({
            event_name: ev.event_name || '',
            start_date: s.date,
            start_time: s.time,
            end_date: e.date,
            end_time: e.time,
            location: ev.location || '',
            remaining_seats: ev.remaining_seats || 0,
        });
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingEvent(null);
        setEditForm({
            event_name: '',
            start_date: '',
            start_time: '',
            end_date: '',
            end_time: '',
            location: '',
            remaining_seats: 0,
        });
    };

    // Handle edit form changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: name === 'remaining_seats' ? Number(value) : value }));
    };

    // Helper to build datetime string
    const buildDateTime = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return null;
        return `${dateStr}T${timeStr}:00`;
    };

    // Save edited event
    const handleSaveEdit = async () => {
        setError('');
        const startIso = buildDateTime(editForm.start_date, editForm.start_time);
        const endIso = buildDateTime(editForm.end_date, editForm.end_time);
        if (!startIso || !endIso) {
            setError('Please provide both start and end date/time.');
            return;
        }
        const startDt = new Date(startIso);
        const endDt = new Date(endIso);
        if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) {
            setError('Invalid start or end date/time.');
            return;
        }
        if (endDt <= startDt) {
            setError('End time must be after start time.');
            return;
        }

        const payload = {
            event_name: editForm.event_name,
            start_time: startIso,
            end_time: endIso,
            location: editForm.location || null,
            remaining_seats: editForm.remaining_seats,
        };

        try {
            setEditLoading(true);
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.put(`${EVENTS_API_BASE}/${editingEvent.event_id}`, payload, { headers });
            setNotification('Event updated successfully');
            setTimeout(() => setNotification(''), 2500);
            cancelEdit();
            fetchAllEvents();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to update event.');
        } finally {
            setEditLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    right: '2rem',
                    background: '#22c55e',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 1000
                }}>
                    {notification} {username && <span>({username})</span>}
                </div>
            )}
            {/* Organizer: show tabs and create/manage UI */}
            {role === 'organizer' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto', marginTop: '2rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className={tab === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('all')}>All Events</button>
                    <button className={tab === 'create' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('create')}>Create Event</button>
                    <button className={tab === 'manage' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('manage')}>Manage My Events</button>
                </div>
            )}
            {/* Tab content */}
            {(role !== 'organizer' || tab === 'all') && (
                <EventsList token={token} showRegister={true} onRegister={handleRegister} events={events} loading={loading} error={error} />
            )}
            {role === 'organizer' && tab === 'create' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {/* You can move the OrganizerEvents form here, or inline a form */}
                    <OrganizerEvents inlineMode={true} onEventCreated={fetchAllEvents} />
                </div>
            )}
            {role === 'organizer' && tab === 'manage' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2>My Events</h2>
                    {/* List and update only own events */}
                    <EventsList
                        token={token}
                        showRegister={false}
                        onRegister={() => { }}
                        events={myEvents}
                        loading={loading}
                        error={error}
                        showEdit={true}
                        onEdit={handleEditEvent}
                    />
                </div>
            )}

            {/* Edit Event Modal */}
            {editingEvent && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div className="glass-panel" style={{
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        <h2 style={{ marginTop: 0 }}>Edit Event</h2>
                        {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Event Name</label>
                            <input
                                name="event_name"
                                value={editForm.event_name}
                                onChange={handleEditChange}
                                className="input-field"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={editForm.start_date}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Start Time</label>
                                <input
                                    type="time"
                                    name="start_time"
                                    value={editForm.start_time}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>End Date</label>
                                <input
                                    type="date"
                                    name="end_date"
                                    value={editForm.end_date}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>End Time</label>
                                <input
                                    type="time"
                                    name="end_time"
                                    value={editForm.end_time}
                                    onChange={handleEditChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location</label>
                            <input
                                name="location"
                                value={editForm.location}
                                onChange={handleEditChange}
                                className="input-field"
                                placeholder="Location"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Remaining Seats</label>
                            <input
                                type="number"
                                name="remaining_seats"
                                value={editForm.remaining_seats}
                                onChange={handleEditChange}
                                className="input-field"
                                min={0}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={handleSaveEdit}
                                className="btn-primary"
                                disabled={editLoading}
                            >
                                {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={cancelEdit}
                                className="btn-secondary"
                                disabled={editLoading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
