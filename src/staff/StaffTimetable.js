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
import { generateWalkaboutBlocks } from '../components/generateWalkabouts';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const StaffTimetable = () => {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [editForm, setEditForm] = useState(null); // holds event being edited
    const modalRef = useRef(null);
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
                    title: item.session_name,
                    doctor_name: item.name || "Unknown", // ✅ ADD THIS
                    start: startDateTime,
                    end: endDateTime,
                    color: ['rescheduled', 'resized'].includes(item.change_type) ? '#D49A00' : '#31B5F7',
                    location: item.location,
                    students: item.students,
                    isPast: endDateTime < now,
                    originalTime: item.original_time,
                    changeType: item.change_type,
                    changeReason: item.change_reason,
                    doctor_email: item.doctor_email,
                };
            });


            console.log('✅ Final mapped events:', mappedEvents);
            setEvents(mappedEvents);

        } catch (err) {
            console.error('❌ Error fetching timetable from /api/scheduling/timetable:', err.response?.data || err.message);
        }
    };

    const handleRequestChange = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.warn("❌ No token found in localStorage");
                return;
            }

            const decoded = JSON.parse(atob(token.split('.')[1]));
            let fromEmail = "";
            const fromName = editForm.fromName || decoded.name || "Unknown";

            if (decoded.role === "staff") {
                try {
                    const staffRes = await axios.get(`${API_BASE_URL}/staff/${decoded.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fromEmail = staffRes.data.email;
                    console.log("📩 Email from staff API (for request change):", fromEmail);
                } catch (error) {
                    console.error("❌ Failed to get email from staff API in request change:", error);
                    return;
                }
            }


            const requestBody = {
                type: "change_request",
                session_name: editForm.title || "Untitled",
                original_session_name: editForm.originalSessionName || editForm.title || "Untitled", // ✅ Add this line
                from_name: fromName,
                from_email: fromEmail,
                original_session:
                    editForm.originalStart && editForm.originalEnd
                        ? moment(editForm.originalStart).format("D MMMM YYYY h:mmA") + " - " +
                        moment(editForm.originalEnd).format("h:mmA")
                        : "Unknown",
                new_session:
                    moment(editForm.start).format("D MMMM YYYY h:mmA") +
                    " - " +
                    moment(editForm.end).format("h:mmA"),
                students: editForm.students || "",
                reason: editForm.changeReason || "No reason provided.",
            };



            await axios.post(
                `${API_BASE_URL}/api/scheduling/request-change-from-staff`,
                requestBody,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("✅ Change request submitted.");
            setEditForm(null);
        } catch (err) {
            console.error("❌ Failed to submit change request:", err.response?.data || err.message);
            alert("Failed to submit change request.");
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
                        onEventDrop={() => { }}
                        onEventResize={() => { }}
                        eventPropGetter={eventStyleGetter}
                        components={{
                            toolbar: CustomToolbar,
                            event: CustomEvent,
                        }}
                        onSelectEvent={(event) => {
                            if (!event.isPast) {
                                setEditForm({
                                    id: event.id,
                                    title: event.title,
                                    originalSessionName: event.title,
                                    location: event.location,
                                    start: moment(event.start).format('YYYY-MM-DDTHH:mm'),
                                    end: moment(event.end).format('YYYY-MM-DDTHH:mm'),
                                    originalStart: event.start,
                                    originalEnd: event.end,
                                    students: event.students || "",
                                    originalTime: event.originalTime
                                        ? moment(event.originalTime, ["D MMMM YYYY h:mmA", "D MMMM YYYY hA"]).toDate()
                                        : event.start,
                                    changeReason: "",
                                    fromName: event.doctor_name || "Unknown", // ✅ FIXED
                                });
                            }
                        }}

                    />
                </div>
            </div>

            {editForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
                    fontFamily: "'Nunito', sans-serif"
                }}>
                    <div ref={modalRef} style={{
                        background: '#fff',
                        padding: '30px 30px',
                        borderRadius: '12px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <h2 style={{ fontWeight: '700', marginBottom: '0px' }}>Request Session Change</h2>

                        <div>
                            <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Session Title</label>
                            <input
                                value={editForm.title}
                                readOnly
                                disabled
                                style={{
                                    width: '95%',
                                    padding: '10px',
                                    fontSize: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                    backgroundColor: '#f3f3f3'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Date</label>
                            <input
                                type="date"
                                value={editForm.start?.split("T")[0]}
                                onChange={(e) => {
                                    const date = e.target.value;
                                    setEditForm({
                                        ...editForm,
                                        start: `${date}T${editForm.start.split("T")[1]}`,
                                        end: `${date}T${editForm.end.split("T")[1]}`,
                                    });
                                }}
                                style={{
                                    width: '95%',
                                    padding: '10px',
                                    fontSize: '15px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>Time</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="time"
                                    value={editForm.start.split("T")[1]}
                                    onChange={(e) => {
                                        const time = e.target.value;
                                        const date = editForm.start.split("T")[0];
                                        setEditForm({ ...editForm, start: `${date}T${time}` });
                                    }}
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        fontSize: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                                <input
                                    type="time"
                                    value={editForm.end.split("T")[1]}
                                    onChange={(e) => {
                                        const time = e.target.value;
                                        const date = editForm.end.split("T")[0];
                                        setEditForm({ ...editForm, end: `${date}T${time}` });
                                    }}
                                    style={{
                                        flex: 2,
                                        padding: '10px',
                                        fontSize: '15px',
                                        borderRadius: '8px',
                                        border: '1px solid #ccc'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontWeight: '600', marginBottom: '6px', display: 'block' }}>
                                Reason for Change (optional)
                            </label>
                            <textarea
                                value={editForm.changeReason}
                                onChange={(e) => setEditForm({ ...editForm, changeReason: e.target.value })}
                                placeholder="Any additional information or special requests..."
                                style={{
                                    width: '95%',
                                    minHeight: '60px',
                                    padding: '10px',
                                    fontSize: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '10px'
                        }}>
                            <button
                                onClick={handleRequestChange}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Request Change
                            </button>
                            <button
                                onClick={() => setEditForm(null)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    backgroundColor: '#f0f0f0',
                                    border: '1px solid #ccc',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StaffTimetable;
