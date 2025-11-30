import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TimePicker from '../components/TimePicker';

const RAW_EVENTS_BASE = import.meta.env.VITE_EVENTS_API_BASE || 'http://localhost:8001';
const EVENTS_API_BASE = RAW_EVENTS_BASE.replace(/\/$/, '') + '/events';

function getCookie(name) {
    const v = `; ${document.cookie}`;
    const parts = v.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

const OrganizerEvents = ({ inlineMode = false, onEventCreated }) => {
    const navigate = useNavigate();

    const [organizerId, setOrganizerId] = useState(null);
    const [role, setRole] = useState(null);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [form, setForm] = useState({
        event_name: '',
        description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        location: '',
        total_seats: 0,
    });

    const [creating, setCreating] = useState(false);

    const [editingId, setEditingId] = useState(null);
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
        const token = getCookie('token');
        const roleCookie = getCookie('role');
        const userIdCookie = getCookie('user_id');

        if (!token || !roleCookie || !userIdCookie) {
            navigate('/');
            return;
        }

        if (roleCookie.toLowerCase() !== 'organizer') {
            navigate('/dashboard');
            return;
        }

        setRole(roleCookie);
        setOrganizerId(userIdCookie);
        fetchEvents(userIdCookie);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const fetchEvents = async (organizer_id) => {
        try {
            setLoading(true);
            setError('');
            const token = getCookie('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(EVENTS_API_BASE, { headers });
            const all = Array.isArray(res.data) ? res.data : [];
            const filtered = all.filter(
                (ev) => ev.organizer_id && String(ev.organizer_id) === String(organizer_id)
            );
            setEvents(filtered);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to fetch events.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: name === 'total_seats' ? Number(value) : value }));
    };

    const buildDateTime = (dateStr, timeStr) => {
        if (!dateStr || !timeStr) return null;
        return `${dateStr}T${timeStr}:00`;
    };

    const clearMessageLater = () => {
        setTimeout(() => setMessage(''), 4000);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setError('');

        if (!organizerId) {
            setError('Organizer ID not found. Please log in again.');
            return;
        }

        const startIso = buildDateTime(form.start_date, form.start_time);
        const endIso = buildDateTime(form.end_date, form.end_time);

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

        if (form.total_seats < 0) {
            setError('Total seats cannot be negative.');
            return;
        }

        const payload = {
            event_name: form.event_name,
            description: form.description || null,
            start_time: startIso,
            end_time: endIso,
            organizer_id: organizerId,
            location: form.location || null,
            total_seats: form.total_seats,
        };

        try {
            setCreating(true);
            const token = getCookie('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.post(EVENTS_API_BASE, payload, { headers });
            setMessage('Event created');
            clearMessageLater();
            if (onEventCreated) onEventCreated();
            setForm({
                event_name: '',
                description: '',
                start_date: '',
                start_time: '',
                end_date: '',
                end_time: '',
                location: '',
                total_seats: 0,
            });
            if (!inlineMode) fetchEvents(organizerId);
        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) setError(detail.map((d) => d.msg).join(', '));
            else setError(detail || 'Failed to create event.');
        } finally {
            setCreating(false);
        }
    };

    const handleLogout = () => {
        document.cookie = 'token=; Max-Age=0; path=/;';
        document.cookie = 'role=; Max-Age=0; path=/;';
        document.cookie = 'username=; Max-Age=0; path=/;';
        document.cookie = 'user_id=; Max-Age=0; path=/;';
        navigate('/');
    };

    const toDateAndTime = (iso) => {
        if (!iso) return { date: '', time: '' };
        const d = new Date(iso);
        if (isNaN(d.getTime())) return { date: '', time: '' };
        const date = d.toISOString().slice(0, 10);
        const time = d.toTimeString().slice(0, 5);
        return { date, time };
    };

    const startEdit = (ev) => {
        setEditingId(ev.event_id || ev.id || ev._id || ev.eventId);
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

    const cancelEdit = () => {
        setEditingId(null);
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

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm((p) => ({ ...p, [name]: name === 'total_seats' ? Number(value) : value }));
    };

    const handleUpdateEvent = async (id) => {
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
            const token = getCookie('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.put(`${EVENTS_API_BASE}/${id}`, payload, { headers });
            setMessage('Event updated');
            clearMessageLater();
            cancelEdit();
            fetchEvents(organizerId);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to update event.');
        } finally {
            setEditLoading(false);
        }
    };

    // Inline mode: show compact form only
    if (inlineMode) {
        return (
            <div className="glass-panel" style={{ padding: '1.25rem', maxWidth: '640px', margin: '0 auto' }}>
                {message && (
                    <div style={{ color: '#10b981', marginBottom: '0.75rem' }}>{message}</div>
                )}
                {error && (
                    <div style={{ color: '#ef4444', marginBottom: '0.75rem' }}>{error}</div>
                )}
                <h3 style={{ marginTop: 0 }}>Create Event</h3>
                <form onSubmit={handleCreateEvent}>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Event Name</label>
                        <input name="event_name" value={form.event_name} onChange={handleChange} className="input-field" required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Start Date</label>
                            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Start Time</label>
                            <TimePicker name="start_time" value={form.start_time} onChange={handleChange} required />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>End Date</label>
                            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>End Time</label>
                            <TimePicker name="end_time" value={form.end_time} onChange={handleChange} required />
                        </div>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Location</label>
                        <input name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="Location" required />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Total Seats</label>
                        <input
                            type="number"
                            name="total_seats"
                            value={form.total_seats}
                            onChange={handleChange}
                            className="input-field number-input"
                            min={0}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={creating} style={{ width: '100%' }}>
                        {creating ? 'Creating...' : 'Create Event'}
                    </button>
                </form>
            </div>
        );
    }

    // Full page: create form + manage events
    return (
        <>
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Create New Event</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={handleLogout} className="btn-primary" style={{ background: '#ef4444' }}>Logout</button>
                    </div>
                </div>

                {message && <div style={{ color: '#10b981', marginTop: '0.75rem' }}>{message}</div>}
                {error && <div style={{ color: '#ef4444', marginTop: '0.75rem' }}>{error}</div>}

                <form onSubmit={handleCreateEvent} style={{ marginTop: '1rem' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Event Name</label>
                        <input name="event_name" value={form.event_name} onChange={handleChange} className="input-field" required />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Description</label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="input-field" style={{ minHeight: 64 }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Start Date</label>
                            <input type="date" name="start_date" value={form.start_date} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Start Time</label>
                            <input type="time" name="start_time" value={form.start_time} onChange={handleChange} className="input-field" required />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>End Date</label>
                            <input type="date" name="end_date" value={form.end_date} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem' }}>End Time</label>
                            <input type="time" name="end_time" value={form.end_time} onChange={handleChange} className="input-field" required />
                        </div>
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Location</label>
                        <input name="location" value={form.location} onChange={handleChange} className="input-field" required />
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Total Seats</label>
                        <input type="number" name="total_seats" value={form.total_seats} onChange={handleChange} className="input-field" min={0} required />
                    </div>
                    <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Event'}</button>
                </form>
            </div>

            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '1rem' }}>My Events</h2>
                {loading ? (
                    <div>Loading events...</div>
                ) : events.length === 0 ? (
                    <div style={{ color: '#94a3b8' }}>No events created yet.</div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {events.map((ev) => (
                            <div key={ev.event_id || ev.id} style={{ background: 'rgba(15,23,42,0.9)', borderRadius: 12, padding: 12, border: '1px solid rgba(148,163,184,0.2)' }}>
                                {editingId === (ev.event_id || ev.id) ? (
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            <input name="event_name" value={editForm.event_name} onChange={handleEditChange} className="input-field" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 8 }}>
                                            <input type="date" name="start_date" value={editForm.start_date} onChange={handleEditChange} className="input-field" />
                                            <input type="time" name="start_time" value={editForm.start_time} onChange={handleEditChange} className="input-field" />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 8 }}>
                                            <input type="date" name="end_date" value={editForm.end_date} onChange={handleEditChange} className="input-field" />
                                            <input type="time" name="end_time" value={editForm.end_time} onChange={handleEditChange} className="input-field" />
                                        </div>
                                        <div style={{ marginBottom: 8 }}>
                                            <input name="location" value={editForm.location} onChange={handleEditChange} className="input-field" placeholder="Location" />
                                        </div>
                                        <div style={{ marginBottom: 8 }}>
                                            <input type="number" name="total_seats" value={editForm.total_seats} onChange={handleEditChange} className="input-field" min={0} placeholder="Total Seats" />
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleUpdateEvent(ev.event_id || ev.id)} className="btn-primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                                            <button onClick={cancelEdit} className="btn-secondary">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 style={{ margin: '0 0 8px 0' }}>{ev.event_name}</h3>
                                        <p style={{ margin: '0 0 6px 0', color: '#94a3b8' }}>{ev.location || 'Location TBD'}</p>
                                        <p style={{ margin: '0 0 6px 0', color: '#cbd5e1' }}><strong>Start:</strong> {new Date(ev.start_time).toLocaleString()}</p>
                                        <p style={{ margin: '0 0 6px 0', color: '#cbd5e1' }}><strong>End:</strong> {new Date(ev.end_time).toLocaleString()}</p>
                                        <p style={{ margin: '0 0 8px 0', color: '#cbd5e1' }}><strong>Total Seats:</strong> {ev.total_seats}</p>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => startEdit(ev)} className="btn-primary">Edit</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default OrganizerEvents;
