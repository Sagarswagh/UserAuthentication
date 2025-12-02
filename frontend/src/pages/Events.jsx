import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import OrganizerEvents from './OrganiseEvents';
import TimePicker from '../components/TimePicker';
import LoadingOverlay from '../components/LoadingOverlay';

const rawEventsBase = import.meta.env.VITE_EVENTS_API_BASE || 'http://localhost:8001/events';
const EVENTS_API_BASE = rawEventsBase.endsWith('/events') ? rawEventsBase : rawEventsBase.replace(/\/$/, '') + '/events';
const NOTIFICATION_SERVICE_URL = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8003';
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8000';

function getCookie(name) {
    const value = `; ${document.cookie} `;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}


const EventsList = ({ token, showRegister, onRegister, onCancel, events, loading, error, showEdit, onEdit, onDelete, showReminder, onReminder, showAnalytics, onAnalytics, title, userBookings = [], availableSeatsMap = {} }) => {
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
                                        const bookings = Array.isArray(userBookings) ? userBookings : [];
                                        const activeBooking = bookings.find(b =>
                                            String(b.event_id) === String(ev.event_id) &&
                                            (b.status === 'confirmed' || b.status === 'waiting')
                                        );
                                        const isRegistered = !!activeBooking;
                                        const availableSeats = availableSeatsMap[ev.event_id];
                                        const buttonText = isRegistered ? 'Cancel Registration' : availableSeats === 0 ? 'Add to Waitlist' : 'Register';
                                        return (
                                            <button
                                                className={isRegistered ? "btn-secondary" : "btn-primary"}
                                                onClick={() => isRegistered ? onCancel(activeBooking) : onRegister(ev)}
                                                style={isRegistered ? {
                                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                    borderColor: '#ef4444',
                                                } : availableSeats === 0 ? {
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
                                    {showAnalytics && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => onAnalytics(ev)}
                                            style={{
                                                marginTop: '0.5rem',
                                                width: '100%',
                                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                            }}
                                        >
                                            📊 Analytics
                                        </button>
                                    )}
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
    const [tab, setTab] = useState('all'); // 'all' | 'create' | 'manage' | 'users'
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [myEvents, setMyEvents] = useState([]);
    const [userBookings, setUserBookings] = useState([]);
    const [availableSeatsMap, setAvailableSeatsMap] = useState({});
    const [cancelConfirm, setCancelConfirm] = useState(null);
    const [analyticsEvent, setAnalyticsEvent] = useState(null);
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [usersOffset, setUsersOffset] = useState(0);
    const [hasMoreUsers, setHasMoreUsers] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [totalUsers, setTotalUsers] = useState(0);

    // Calendar view states
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');

    // Admin user management state
    const [allUsers, setAllUsers] = useState([]);
    const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);

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
        fetchUserBookings();
    }, [token, navigate]);

    // Fetch user bookings
    const fetchUserBookings = async () => {
        if (!userId) return;
        try {
            const res = await axios.get(`/user/${userId}/bookings`);
            setUserBookings(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to fetch bookings:', err);
            setUserBookings([]);
        }
    };


    // Fetch available seats for events
    const fetchAvailableSeats = async (events) => {
        // Fetch all seats in parallel using Promise.all
        const seatPromises = events.map(async (event) => {
            try {
                const res = await axios.get(`/available-seats/${event.event_id}`);
                return { eventId: event.event_id, seats: res.data.remaining_seats };
            } catch (err) {
                console.error(`Failed to fetch seats for ${event.event_id}:`, err);
                return { eventId: event.event_id, seats: null };
            }
        });

        const results = await Promise.all(seatPromises);

        // Build the seats map from results
        const seatsMap = {};
        results.forEach(({ eventId, seats }) => {
            seatsMap[eventId] = seats;
        });

        setAvailableSeatsMap(seatsMap);
    };

    // Fetch all events
    const fetchAllEvents = async () => {
        try {
            setLoading(true);
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(EVENTS_API_BASE, { headers });
            const eventsList = Array.isArray(res.data) ? res.data : [];
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
                user_email: username,
                event_Name: event.event_name
            };

            const res = await axios.post(url, payload, { headers });
            if (res.status === 200 || res.status === 201) {
                setNotification('Successfully registered for the event');
                // Optimistic update
                setUserBookings(prev => [...prev, { event_id: event.event_id }]);
                setTimeout(() => setNotification(''), 2500);

                // Wait for all refresh calls to complete together
                await Promise.all([
                    fetchAllEvents(),
                    fetchUserBookings()
                ]);
            } else {
                setNotification('Registration response: ' + res.statusText);
            }
        } catch (err) {
            setNotification(err.response?.data?.detail || 'Failed to register.');
        }
    };

    // Cancel registration handler - shows confirmation
    const handleCancelRegistration = async (booking) => {
        if (!booking || !booking.booking_id) {
            setNotification('Invalid booking');
            return;
        }
        // Set confirmation modal
        setCancelConfirm(booking);
    };

    // Confirm cancellation
    const confirmCancel = async () => {
        const booking = cancelConfirm;
        setCancelConfirm(null);

        try {
            const url = `/booking/cancel/${booking.booking_id}`;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await axios.post(url, {}, { headers });
            if (res.status === 200 || res.status === 204) {
                setNotification('Registration cancelled successfully');
                // Optimistic update: remove from userBookings
                setUserBookings(prev => prev.filter(b => b.booking_id !== booking.booking_id));
                setTimeout(() => setNotification(''), 2500);

                // Wait for all refresh calls to complete together
                await Promise.all([
                    fetchAllEvents(),
                    fetchUserBookings()
                ]);
            } else {
                setNotification('Cancellation response: ' + res.statusText);
            }
        } catch (err) {
            setNotification(err.response?.data?.detail || 'Failed to cancel registration.');
        }
    };

    // Fetch total count of registered users
    const fetchBookingsCount = async (eventId) => {
        try {
            const res = await axios.get('/bookings/count', {
                params: { event_id: eventId },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            console.log('Count API response:', res.data);
            // Extract total_bookings from response
            const count = res.data?.total_bookings || 0;
            console.log('Extracted count:', count);
            return count;
        } catch (err) {
            console.error('Failed to fetch bookings count:', err);
            return 0;
        }
    };


    // Month navigation functions
    const handlePrevMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setSelectedDate(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setSelectedDate(newDate);
    };

    const isCurrentMonth = () => {
        const today = new Date();
        return selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear();
    };

    const filteredEvents = events.filter(e => {
        // Month filter
        const eventDate = e.date || e.event_date || e.start_time;
        if (!eventDate) return false;
        const d = new Date(eventDate);
        const matchesMonth = d.getMonth() === selectedDate.getMonth() &&
            d.getFullYear() === selectedDate.getFullYear();

        // Search filter (case-insensitive)
        const matchesSearch = searchQuery.trim() === '' ||
            (e.event_name && e.event_name.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesMonth && matchesSearch;
    });


    // Fetch registered users for analytics (with pagination)
    const fetchRegisteredUsers = async (eventId, pageOffset = 0) => {
        console.log(`fetchRegisteredUsers called with pageOffset=${pageOffset}`);
        setLoadingUsers(true);
        try {
            const res = await axios.get('/bookings/batch', {
                params: {
                    event_id: eventId,
                    offset: pageOffset,
                    batch_size: 5
                },
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const newUsers = res.data || [];
            console.log(`Received ${newUsers.length} users from page ${pageOffset}`);
            if (pageOffset === 0) {
                setRegisteredUsers(newUsers);
            } else {
                setRegisteredUsers(prev => [...prev, ...newUsers]);
            }
            // If we got exactly 5 records, there might be more
            setHasMoreUsers(newUsers.length === 5);
            // Next page number
            setUsersOffset(pageOffset + 1);
        } catch (err) {
            // Handle 404 as end of results (no more data)
            if (err.response?.status === 404) {
                setHasMoreUsers(false);
            } else {
                console.error('Failed to fetch registered users:', err);
                setNotification('Failed to load analytics data');
            }
        } finally {
            setLoadingUsers(false);
        }
    };

    // Open analytics modal
    const handleAnalytics = async (event) => {
        setAnalyticsEvent(event);
        setRegisteredUsers([]);
        setUsersOffset(0);
        setHasMoreUsers(false);

        // First get total count
        const count = await fetchBookingsCount(event.event_id);
        setTotalUsers(count);

        // Then fetch first batch
        fetchRegisteredUsers(event.event_id, 0);
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
                type: "event_reminder",
                event: {
                    event_id: event.event_id,
                    event_name: event.event_name,
                    description: event.description || "",
                    start_time: event.start_time,
                    end_time: event.end_time,
                    organizer_id: event.organizer_id || "",
                    location: event.location || "",
                    remaining_seats: availableSeatsMap[event.event_id] !== undefined ? availableSeatsMap[event.event_id] : 0,
                    reminder_type: "event_reminder"
                }
            };
            // The notification service
            await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, payload);
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

    // Admin: Fetch all users
    const fetchAllUsers = async () => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${AUTH_SERVICE_URL}/api/users/users`, { headers });
            setAllUsers(res.data || []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setNotification('Failed to fetch users');
        }
    };

    // Admin: Delete user
    const handleDeleteUser = async (userId) => {
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.delete(`${AUTH_SERVICE_URL}/api/users/users/${userId}`, { headers });
            setNotification('User deleted successfully');
            setTimeout(() => setNotification(''), 2500);
            setDeleteUserConfirm(null);
            fetchAllUsers(); // Refresh list
        } catch (err) {
            console.error('Failed to delete user:', err);
            setNotification(err.response?.data?.detail || 'Failed to delete user');
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <LoadingOverlay isLoading={loading} />
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
            {/* Organizer/Admin: show tabs */}
            {(role === 'organizer' || role === 'admin') && (
                <div style={{ maxWidth: '1100px', margin: '0 auto', marginTop: '2rem', marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                    <button className={tab === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('all')}>All Events</button>
                    {role === 'organizer' && (
                        <button className={tab === 'create' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('create')}>Create Event</button>
                    )}
                    <button className={tab === 'manage' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('manage')}>
                        {role === 'admin' ? 'Manage Events' : 'Manage My Events'}
                    </button>
                    {role === 'admin' && (
                        <button className={tab === 'users' ? 'btn-primary' : 'btn-secondary'} onClick={() => { setTab('users'); fetchAllUsers(); }}>Manage Users</button>
                    )}
                </div>
            )}
            {/* Tab content */}
            {((role !== 'organizer' && role !== 'admin') || tab === 'all') && (
                <>
                    {/* Search Bar */}
                    <div style={{
                        maxWidth: '600px',
                        margin: '0 auto 1.5rem',
                        position: 'relative'
                    }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '1.2rem'
                            }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Search events by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 3rem 0.75rem 3rem',
                                    background: 'rgba(30, 41, 59, 0.7)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(10px)'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        fontSize: '1.5rem',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        lineHeight: 1,
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = 'white'}
                                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                                    title="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Month Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: '2rem',
                        gap: '1rem'
                    }}>
                        <button
                            onClick={handlePrevMonth}
                            disabled={isCurrentMonth()}
                            style={{
                                background: isCurrentMonth() ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: isCurrentMonth() ? '#64748b' : 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: isCurrentMonth() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            &lt; Previous
                        </button>

                        <h2 style={{ margin: 0, minWidth: '200px', textAlign: 'center' }}>
                            {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>

                        <button
                            onClick={handleNextMonth}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Next &gt;
                        </button>
                    </div>

                    <EventsList
                        token={token}
                        showRegister={true}
                        onRegister={handleRegister}
                        onCancel={handleCancelRegistration}
                        events={filteredEvents}
                        loading={loading}
                        error={error}
                        title={`Events for ${selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`}
                        userBookings={userBookings}
                        availableSeatsMap={availableSeatsMap}
                        showAnalytics={role === 'organizer'}
                        onAnalytics={handleAnalytics}
                    />
                </>
            )}
            {(role === 'organizer' || role === 'admin') && tab === 'create' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    {/* You can move the OrganizerEvents form here, or inline a form */}
                    <OrganizerEvents inlineMode={true} onEventCreated={fetchAllEvents} />
                </div>
            )}
            {(role === 'organizer' || role === 'admin') && tab === 'manage' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 0' }}>
                    <h2 style={{ marginBottom: '2rem' }}>{role === 'admin' ? 'Manage Events' : 'My Events'}</h2>
                    {/* List and update only own events for organizers, all events for admin */}
                    <EventsList
                        token={token}
                        showRegister={false}
                        onRegister={() => { }}
                        events={role === 'admin' ? events : myEvents}
                        loading={loading}
                        error={error}
                        showEdit={true}
                        onEdit={handleEditEvent}
                        onDelete={(eventId, eventName) => setDeleteConfirm({ id: eventId, name: eventName })}
                        showReminder={true}
                        onReminder={handleSendReminder}
                        showAnalytics={true}
                        onAnalytics={handleAnalytics}
                        availableSeatsMap={availableSeatsMap}
                    />
                </div>
            )}

            {/* Admin: Manage Users Tab */}
            {role === 'admin' && tab === 'users' && (
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 0' }}>
                    <h2 style={{ marginBottom: '2rem' }}>Manage Users</h2>
                    <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid rgba(99, 102, 241, 0.3)' }}>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#cbd5e1' }}>Email</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#cbd5e1' }}>Phone</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#cbd5e1' }}>Role</th>
                                    <th style={{ textAlign: 'left', padding: '0.75rem', color: '#cbd5e1' }}>Created</th>
                                    <th style={{ textAlign: 'center', padding: '0.75rem', color: '#cbd5e1' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map((user) => (
                                    <tr key={user.user_id} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                                        <td style={{ padding: '0.75rem' }}>{user.email}</td>
                                        <td style={{ padding: '0.75rem' }}>{user.phone || '-'}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                backgroundColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : user.role === 'organizer' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                color: user.role === 'admin' ? '#f87171' : user.role === 'organizer' ? '#818cf8' : '#4ade80',
                                                fontSize: '0.875rem'
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => setDeleteUserConfirm({ userId: user.user_id, email: user.email })}
                                                    disabled={user.role === 'admin'}
                                                    className="btn-secondary"
                                                    style={{
                                                        padding: '0.35rem 0.75rem',
                                                        fontSize: '0.8rem',
                                                        background: 'rgba(239, 68, 68, 0.2)',
                                                        borderColor: 'rgba(239, 68, 68, 0.5)',
                                                        color: '#f87171',
                                                        opacity: user.role === 'admin' ? 0.5 : 1
                                                    }}
                                                    title={user.role === 'admin' ? 'Cannot delete admin' : 'Delete user'}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {allUsers.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No users found</p>
                        )}
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancelConfirm && (
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
                        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Cancel Registration</h2>
                        <p style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>
                            Do you want to cancel your registration for this event?
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={confirmCancel}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                }}
                            >
                                Yes, Cancel
                            </button>
                            <button
                                onClick={() => setCancelConfirm(null)}
                                className="btn-secondary"
                                style={{ flex: 1 }}
                            >
                                No, Keep Registration
                            </button>
                        </div>
                    </div>
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

            {/* Analytics Modal */}
            {analyticsEvent && (
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
                        maxWidth: '900px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Event Analytics: {analyticsEvent.event_name}</h2>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                            Registered Participants {totalUsers > 0 && `(1-${registeredUsers.length} of ${totalUsers})`}
                        </p>

                        {registeredUsers.length === 0 && !loadingUsers ? (
                            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No registrations yet</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    marginBottom: '1.5rem',
                                }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid rgba(148, 163, 184, 0.3)' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1' }}>Email</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1' }}>Booking Time</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#cbd5e1' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registeredUsers.map((user, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)' }}>
                                                <td style={{ padding: '0.75rem', color: '#e2e8f0' }}>{user.user_email}</td>
                                                <td style={{ padding: '0.75rem', color: '#94a3b8' }}>
                                                    {new Date(user.booking_time).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.875rem',
                                                        background: user.status === 'confirmed' ? 'rgba(34, 197, 94, 0.2)' :
                                                            user.status === 'waiting' ? 'rgba(249, 115, 22, 0.2)' :
                                                                'rgba(148, 163, 184, 0.2)',
                                                        color: user.status === 'confirmed' ? '#4ade80' :
                                                            user.status === 'waiting' ? '#fb923c' :
                                                                '#94a3b8',
                                                    }}>
                                                        {user.status || 'Unknown'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {loadingUsers && <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading...</p>}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            {hasMoreUsers && !loadingUsers && (
                                <button
                                    onClick={() => fetchRegisteredUsers(analyticsEvent.event_id, usersOffset)}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    Load More
                                </button>
                            )}
                            <button
                                onClick={() => setAnalyticsEvent(null)}
                                className="btn-secondary"
                                style={{ flex: hasMoreUsers ? 1 : 'auto' }}
                            >
                                Close
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

            {/* Delete User Confirmation Modal */}
            {deleteUserConfirm && (
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
                        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Delete User</h2>
                        <p style={{ marginBottom: '1.5rem', color: '#cbd5e1' }}>
                            Are you sure you want to delete user <strong>{deleteUserConfirm.email}</strong>?
                            This action cannot be undone.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => handleDeleteUser(deleteUserConfirm.userId)}
                                className="btn-primary"
                                style={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                }}
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={() => setDeleteUserConfirm(null)}
                                className="btn-secondary"
                                style={{ flex: 1 }}
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
