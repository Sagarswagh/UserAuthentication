import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import OrganizerEvents from './OrganiseEvents';
import TimePicker from '../components/TimePicker';

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
const EventsList = ({ token, showRegister, onRegister, events, loading, error, showEdit, onEdit, onDelete, showReminder, onReminder, title, userBookings = [], availableSeatsMap = {} }) => {
    return (
        <div style={{ padding: '2rem', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {title && <h1 style={{ marginBottom: '1rem' }}>{title}</h1>}
                {loading && <p>Loading events...</p>}
                {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                    {events.map((ev) => (
                        <div key={ev.event_id} className="glass-panel" style={{ padding: '1rem', position: 'relative' }}>
                            <h3 style={{ margin: 0 }}>{ev.event_name}</h3>
                            <p style={{ color: '#94a3b8', margin: '0.5rem 0' }}>{ev.location || 'Location TBD'}</p>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                                <strong>Start:</strong> {new Date(ev.start_time).toLocaleString()}
                            </p>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                                <strong>End:</strong> {new Date(ev.end_time).toLocaleString()}
                            </p>
                            <p style={{ fontSize: '0.9rem', margin: '0.25rem 0' }}>
                                <strong>Available:</strong> {availableSeatsMap[ev.event_id] !== undefined ? availableSeatsMap[ev.event_id] : '...'}/{ev.total_seats}
                            </p>
                            {showReminder && (
                                <button
                                    onClick={() => onReminder(ev)}
                                    title="Send Reminder"
                                    style={{
                                        position: 'absolute',
                                        top: '1rem',
                                        right: '1rem',
                                        background: 'transparent',
                                        border: '1px solid rgba(99, 102, 241, 0.5)',
                                        borderRadius: '0.5rem',
                                        padding: '0.4rem 0.6rem',
                                        cursor: 'pointer',
                                        color: '#cbd5e1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.8rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(99, 102, 241, 0.1)';
                                        e.target.style.color = '#fff';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.color = '#cbd5e1';
                                    }}
                                >
                                    <span>🔔</span>
                                    Send Reminder
                                </button>
                            )}
                            {showRegister && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    {(() => {
                                        const isRegistered = userBookings.some(b => String(b.event_id) === String(ev.event_id));
                                        const availableSeats = availableSeatsMap[ev.event_id];
                                        const buttonText = isRegistered ? 'Registered' : availableSeats === 0 ? 'Add to Waitlist' : 'Register';
                                        console.log(`Event ${ev.event_name}: isRegistered=${isRegistered}, availableSeats=${availableSeats}, buttonText=${buttonText}`);
                                        return (
                                            <button
                                                className={isRegistered ? "btn-secondary" : "btn-primary"}
                                                onClick={() => onRegister(ev)}
                                                disabled={isRegistered}
                                                style={availableSeats === 0 && !isRegistered ? {
                                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                                } : {}}
                                            >
                                                {buttonText}
                                            </button>
                                        );
                                    })()}
                                </div>
                            )}
                            {showEdit && (
                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => onEdit(ev)}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <span style={{ fontSize: '0.875rem' }}>✏️</span>
                                        Edit
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={() => onDelete(ev.event_id, ev.event_name)}
                                        style={{
                                            flex: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.35rem',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            borderColor: 'rgba(239, 68, 68, 0.5)',
                                            color: '#f87171',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <span style={{ fontSize: '0.875rem' }}>🗑️</span>
                                        Delete
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
    const userId = (getCookie('user_id') || '').trim();
    const [notification, setNotification] = useState('');
    const [tab, setTab] = useState('all'); // 'all' | 'create' | 'manage'
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [myEvents, setMyEvents] = useState([]);
    const [userBookings, setUserBookings] = useState([]);
    const [availableSeatsMap, setAvailableSeatsMap] = useState({});

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
        total_seats: 0,
    });
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        console.log('🔵 useEffect running - token:', !!token, 'role:', role, 'userId:', userId);
        if (!token) navigate('/');
        // Show notification from sessionStorage after redirect (for sign in)
        const notif = window.sessionStorage.getItem('auth_notification');
        if (notif) {
            setNotification(notif);
            setTimeout(() => setNotification(''), 2500);
            window.sessionStorage.removeItem('auth_notification');
        }
        fetchAllEvents();
        // Fetch bookings for all users (both students and organizers)
        console.log('🟢 Calling fetchUserBookings for role:', role);
        fetchUserBookings();
    }, [token, navigate]);

    // Fetch user bookings
    const fetchUserBookings = async () => {
        console.log('📞 fetchUserBookings called with userId:', userId);
        if (!userId) {
            console.log('❌ No userId, returning early');
            return;
        }
        try {
            const url = `/user/${userId}/bookings`;
            console.log('📡 Fetching from:', url);
            const res = await axios.get(url);
            console.log('✅ Bookings fetched:', res.data);
            setUserBookings(res.data || []);
        } catch (err) {
            console.error('❌ Failed to fetch bookings:', err);
        }
    };

    // Log whenever userBookings changes
    useEffect(() => {
        console.log('📊 userBookings updated. Length:', userBookings.length, 'Data:', userBookings);
    }, [userBookings]);

    // Fetch available seats for events
    const fetchAvailableSeats = async (events) => {
        const seatsMap = {};
        for (const event of events) {
            try {
                const res = await axios.get(`/available-seats/${event.event_id}`);
                seatsMap[event.event_id] = res.data.remaining_seats;
            } catch (err) {
                console.error(`Failed to fetch seats for ${event.event_id}:`, err);
                seatsMap[event.event_id] = null;
            }
        }
        setAvailableSeatsMap(seatsMap);
    };

    // Fetch all events
    const fetchAllEvents = async () => {
        try {
            setLoading(true);
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(EVENTS_API_BASE, { headers });
            const eventsList = res.data || [];
            setEvents(eventsList);
            if (role === 'organizer' && userId) {
                setMyEvents(eventsList.filter(ev => ev.organizer_id && ev.organizer_id.toLowerCase() === userId.toLowerCase()));
            }
            setError('');
            // Fetch available seats after events are loaded
            fetchAvailableSeats(eventsList);
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Failed to fetch events');
        } finally {
            setLoading(false);
        }
    };

    // Register handler
    const handleRegister = async (event) => {
        try {
            const url = '/book';
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const payload = {
                event_id: event.event_id,
                user_id: userId,
                user_email: username, // Assuming username is the email as per requirement
                event_Name: event.event_name
            };

            const res = await axios.post(url, payload, { headers });
            if (res.status === 200 || res.status === 201) {
                setNotification('Successfully registered for the event');
                // Optimistic update
                setUserBookings(prev => [...prev, { event_id: event.event_id }]);
                setTimeout(() => setNotification(''), 2500);
                fetchAllEvents();
                // Add a small delay to allow backend to update
                setTimeout(() => {
                    fetchUserBookings();
                }, 500);
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
            total_seats: ev.total_seats || 0,
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
            total_seats: 0,
        });
    };

    // Handle edit form changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: name === 'total_seats' ? Number(value) : value }));
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
            total_seats: editForm.total_seats,
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

    // Delete event
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleDeleteEvent = async (eventId) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.delete(`${EVENTS_API_BASE}/${eventId}`, { headers });
            setNotification('Event deleted successfully');
            setTimeout(() => setNotification(''), 2500);
            setDeleteConfirm(null);
            fetchAllEvents();
        } catch (err) {
            console.error(err);
            setNotification(err.response?.data?.detail || 'Failed to delete event.');
        }
    };

    // Send Reminder
    const handleSendReminder = async (event) => {
        try {
            const payload = {
                event_id: event.event_id,
                notification_type: "event_reminder"
            };
            // The notification service is on port 8003
            await axios.post('http://localhost:8003/api/notifications/send', payload);
            setNotification(`Reminder sent for "${event.event_name}"`);
            console.log(`Reminder sent for "${event.event_name}"`);
            setTimeout(() => setNotification(''), 2500);
        } catch (err) {
            console.error('Failed to send reminder:', err);
            setNotification('Failed to send reminder. Is the service running?');
        }
    };

    const handleLogout = () => {
        document.cookie = 'token=; Max-Age=0; path=/;';
        document.cookie = 'role=; Max-Age=0; path=/;';
        document.cookie = 'username=; Max-Age=0; path=/;';
        document.cookie = 'user_id=; Max-Age=0; path=/;';
        navigate('/');
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            {/* User Menu - Top Right */}
            <div style={{
                position: 'fixed',
                top: '1.5rem',
                right: '2rem',
                zIndex: 100
            }}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        style={{
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem 1rem',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                        onMouseLeave={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
                    >
                        <span style={{ fontSize: '1rem' }}>👤</span>
                        {username || 'User'}
                        <span style={{ fontSize: '0.75rem' }}>▼</span>
                    </button>

                    {showUserMenu && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            right: 0,
                            background: 'rgba(15, 23, 42, 0.98)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            minWidth: '150px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                        }}>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#f87171',
                                    padding: '0.6rem 1rem',
                                    borderRadius: '0.25rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                                onMouseLeave={(e) => e.target.style.background = 'transparent'}
                            >
                                <span>🚪</span>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                    {notification}
                </div>
            )}
            {/* Organizer: show tabs and create/manage UI */}
            <div style={{ position: 'fixed', bottom: '10px', left: '10px', zIndex: 9999 }}>
                <button onClick={() => {
                    console.log('--- DEBUG STATE ---');
                    console.log('User ID:', userId);
                    console.log('Role:', role);
                    console.log('Events:', events);
                    console.log('User Bookings:', userBookings);
                    if (events.length > 0 && userBookings.length > 0) {
                        const evId = events[0].event_id;
                        const bkId = userBookings[0].event_id;
                        console.log(`Comparing Event[0] (${evId}) with Booking[0] (${bkId})`);
                        console.log('Match:', String(evId) === String(bkId));
                    }
                    fetchUserBookings(); // Manually trigger fetch
                }}>Debug State</button>
            </div>
            {role === 'organizer' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto', marginTop: '2rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className={tab === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('all')}>All Events</button>
                    <button className={tab === 'create' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('create')}>Create Event</button>
                    <button className={tab === 'manage' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('manage')}>Manage My Events</button>
                </div>
            )}
            {/* Tab content */}
            {(role !== 'organizer' || tab === 'all') && (
                <EventsList token={token} showRegister={true} onRegister={handleRegister} events={events} loading={loading} error={error} title="All Events" userBookings={userBookings} availableSeatsMap={availableSeatsMap} />
            )}
            {role === 'organizer' && tab === 'create' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {/* You can move the OrganizerEvents form here, or inline a form */}
                    <OrganizerEvents inlineMode={true} onEventCreated={fetchAllEvents} />
                </div>
            )}
            {role === 'organizer' && tab === 'manage' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 0' }}>
                    <h2 style={{ marginBottom: '2rem' }}>My Events</h2>
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
                        onDelete={(eventId, eventName) => setDeleteConfirm({ id: eventId, name: eventName })}
                        showReminder={true}
                        onReminder={handleSendReminder}
                    />
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
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
                        maxWidth: '450px',
                        width: '90%',
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Delete Event</h2>
                        <p style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>
                            Are you sure you want to delete "<strong>{deleteConfirm.name}</strong>"?
                            This action cannot be undone.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => handleDeleteEvent(deleteConfirm.id)}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                }}
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn-secondary"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
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
                                <TimePicker
                                    name="start_time"
                                    value={editForm.start_time}
                                    onChange={handleEditChange}
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
                                <TimePicker
                                    name="end_time"
                                    value={editForm.end_time}
                                    onChange={handleEditChange}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Total Seats</label>
                            <input
                                type="number"
                                name="total_seats"
                                value={editForm.total_seats}
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
