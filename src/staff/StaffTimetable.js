import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import API_BASE_URL from '../apiConfig';
import StaffNavbar from './StaffNavbar';
import { getStartEndTime } from '../pages_student/parseTime';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const StaffTimetable = () => {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [calendarView, setCalendarView] = useState(Views.WORK_WEEK);
    const [calendarDate, setCalendarDate] = useState(new Date());

    const fetchTimetable = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('❌ No token found in localStorage');
            return;
        }

        let mcrNumber = null;
        let userRole = null;

        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            mcrNumber = decoded.id;
            userRole = decoded.role;
            console.log('✅ Decoded token:', { mcrNumber, userRole });
        } catch (err) {
            console.error('❌ Failed to decode token:', err);
            return;
        }

        let staffEmail = null;
        if (userRole === 'staff') {
            try {
                const res = await axios.get(`${API_BASE_URL}/staff/${mcrNumber}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                staffEmail = res.data.email;
                console.log('📩 Fetched staff email:', staffEmail);
            } catch (error) {
                console.error('❌ Error fetching staff email:', error);
                return;
            }
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/api/scheduling/timetable`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('📅 Raw sessions fetched:', response.data);

            const now = new Date();

            const filtered = response.data.filter(item => {
                if (userRole === 'management') return true;
                return item.doctor_email === staffEmail;
            });

            console.log('🔍 Filtered sessions:', filtered);

            const mappedEvents = filtered.map((item) => {
                const [startTimeStr, endTimeStr] = getStartEndTime(item.time);
                const startDateTime = moment(`${item.date} ${startTimeStr}`, [
                    'D MMMM YYYY h:mmA',
                    'D MMMM YYYY hA',
                ]).toDate();
                const endDateTime = moment(`${item.date} ${endTimeStr}`, [
                    'D MMMM YYYY h:mmA',
                    'D MMMM YYYY hA',
                ]).toDate();

                return {
                    id: item.id,
                    title: `${item.session_name} (${item.name})`,
                    start: startDateTime,
                    end: endDateTime,
                    color: ['rescheduled', 'resized'].includes(item.change_type) ? '#D49A00' : '#31B5F7',
                    location: item.location,
                    students: item.students,
                    isPast: endDateTime < now,
                    originalTime: item.original_time,
                    changeType: item.change_type,
                    changeReason: item.change_reason,
                };
            });

            console.log('✅ Final mapped events:', mappedEvents);
            setEvents(mappedEvents);

        } catch (err) {
            console.error('❌ Error fetching timetable from /api/scheduling/timetable:', err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchTimetable();
        const interval = setInterval(fetchTimetable, 10000);
        return () => clearInterval(interval);
    }, []);

    const getEventColor = (event) => {
        if (event.isPast) return '#999999';
        if (['rescheduled', 'resized'].includes(event.changeType)) return '#D49A00';
        return '#3174ad';
    };

    const eventStyleGetter = (event) => ({
        style: {
            backgroundColor: getEventColor(event),
            borderRadius: '4px',
            opacity: 0.9,
            color: 'white',
            border: 'none',
            display: 'block',
            cursor: event.isPast ? 'not-allowed' : 'pointer',
        },
    });

    const CustomToolbar = ({ label, onNavigate, onView }) => (
        <div className="rbc-toolbar">
            <span className="rbc-btn-group">
                <button onClick={() => onNavigate('PREV')}>Prev</button>
                <button onClick={() => onNavigate('TODAY')}>Today</button>
                <button onClick={() => onNavigate('NEXT')}>Next</button>
            </span>

            <span className="rbc-toolbar-label">{label}</span>

            <span className="rbc-btn-group">
                <button onClick={() => onView('month')}>Month</button>
                <button onClick={() => onView('work_week')}>Week</button>
                <button onClick={() => onView('agenda')}>Agenda</button>
            </span>
        </div>
    );

    const CustomEvent = ({ event }) => (
        <div>
            <div>
                <strong>{event.title}</strong>
            </div>
            {event.location && (
                <div style={{ fontSize: '0.75em', marginTop: '2px' }}>📍 {event.location}</div>
            )}
        </div>
    );

    return (
        <>
            <StaffNavbar homeRoute="/management-home" />
            <div style={{ padding: '20px' }} ref={calendarRef}>
                <div
                    style={{
                        height: '75vh',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '10px',
                        background: 'white',
                    }}
                >
                    <DnDCalendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={calendarView}
                        onView={setCalendarView}
                        date={calendarDate}
                        onNavigate={setCalendarDate}
                        views={['month', 'work_week', 'agenda']}
                        min={new Date(1970, 1, 1, 8, 0)}
                        max={new Date(1970, 1, 1, 18, 0)}
                        selectable={false}
                        resizable={false}
                        draggableAccessor={() => false}
                        onEventDrop={() => {}}
                        onEventResize={() => {}}
                        eventPropGetter={eventStyleGetter}
                        components={{
                            toolbar: CustomToolbar,
                            event: CustomEvent,
                        }}
                    />
                </div>
            </div>
        </>
    );
};

export default StaffTimetable;
