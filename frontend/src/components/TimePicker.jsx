import React, { useState, useRef, useEffect } from 'react';

const TimePicker = ({ value, onChange, name, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempHour, setTempHour] = useState('12');
    const [tempMinute, setTempMinute] = useState('00');
    const [tempPeriod, setTempPeriod] = useState('PM');
    const dropdownRef = useRef(null);

    // Initialize from value prop
    useEffect(() => {
        if (value) {
            const [hours, minutes] = value.split(':');
            const hour24 = parseInt(hours);
            const isPM = hour24 >= 12;
            const hour12 = hour24 % 12 || 12;

            setTempHour(String(hour12).padStart(2, '0'));
            setTempMinute(minutes);
            setTempPeriod(isPM ? 'PM' : 'AM');
        }
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const formatDisplayTime = () => {
        if (!value) return '--:-- --';
        const [hours, minutes] = value.split(':');
        const hour24 = parseInt(hours);
        const isPM = hour24 >= 12;
        const hour12 = hour24 % 12 || 12;
        return `${String(hour12).padStart(2, '0')}:${minutes} ${isPM ? 'PM' : 'AM'}`;
    };

    const handleOk = () => {
        let hour24 = parseInt(tempHour);
        if (tempPeriod === 'PM' && hour24 !== 12) hour24 += 12;
        if (tempPeriod === 'AM' && hour24 === 12) hour24 = 0;

        const timeString = `${String(hour24).padStart(2, '0')}:${tempMinute}`;
        onChange({ target: { name, value: timeString } });
        setIsOpen(false);
    };

    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <input
                type="text"
                className="input-field"
                value={formatDisplayTime()}
                onClick={() => setIsOpen(!isOpen)}
                readOnly
                required={required}
                style={{ cursor: 'pointer' }}
                placeholder="--:-- --"
            />

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '0.25rem',
                    background: 'rgba(15, 23, 42, 0.98)',
                    border: '1px solid rgba(99, 102, 241, 0.5)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                        {/* Hours */}
                        <div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#94a3b8', textAlign: 'center' }}>Hour</div>
                            <select
                                value={tempHour}
                                onChange={(e) => setTempHour(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    color: 'white',
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                }}
                            >
                                {hours.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>

                        {/* Minutes */}
                        <div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#94a3b8', textAlign: 'center' }}>Min</div>
                            <select
                                value={tempMinute}
                                onChange={(e) => setTempMinute(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    color: 'white',
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    maxHeight: '200px',
                                }}
                            >
                                {minutes.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* AM/PM */}
                        <div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#94a3b8', textAlign: 'center' }}>Period</div>
                            <select
                                value={tempPeriod}
                                onChange={(e) => setTempPeriod(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    color: 'white',
                                    padding: '0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleOk}
                        className="btn-primary"
                        style={{ width: '100%', padding: '0.6rem' }}
                        type="button"
                    >
                        OK
                    </button>
                </div>
            )}
        </div>
    );
};

export default TimePicker;
