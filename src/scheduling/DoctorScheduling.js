import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/DoctorScheduler.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const DoctorScheduling = ({ sessions }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ title: '', doctor: '', location: '', start: '', end: '', color: '' });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    const mappedEvents = sessions.map((s, index) => {
      const { startDate, endDate } = parseDateAndTime(s.date, s.time);
      return {
        id: s.id ?? index,
        title: s.session_name,
        doctor: s.name,
        location: s.location,
        start: startDate,
        end: endDate,
        color: '#3174ad'
      };
    });
    setEvents(mappedEvents);
  }, [sessions]);

  const parseDateAndTime = (dateStr, timeStr) => {
    const [day, monthName, year] = dateStr.split(' ');
    const month = monthStrToNum(monthName);

    let startHour = 9, startMinute = 0, endHour = 10, endMinute = 0;

    if (timeStr && timeStr !== "-" && timeStr !== "—") {
      const rangeMatch = timeStr.match(/(.+?)(?:-|to)(.+)/i);
      if (rangeMatch) {
        const startTime = parseSingleTime(rangeMatch[1].trim());
        const endTime = parseSingleTime(rangeMatch[2].trim());
        startHour = startTime.hour;
        startMinute = startTime.minute;
        endHour = endTime.hour;
        endMinute = endTime.minute;
      } else {
        const singleTime = parseSingleTime(timeStr);
        startHour = singleTime.hour;
        startMinute = singleTime.minute;
        endHour = startHour + 1;
        endMinute = startMinute;
      }
    }

    const startDate = new Date(year, month, parseInt(day), startHour, startMinute);
    const endDate = new Date(year, month, parseInt(day), endHour, endMinute);
    return { startDate, endDate };
  };

  const parseSingleTime = (timeStr) => {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    let hour = parseInt(match[1]);
    const minute = match[2] ? parseInt(match[2]) : 0;
    const ampm = match[3].toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    return { hour, minute };
  };

  const monthStrToNum = (monthStr) => {
    const months = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11
    };
    return months[monthStr] ?? 0;
  };

  const handleSelectEvent = (event, e) => {
    const popupWidth = 300, popupHeight = 300;
    const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
    let x = e.clientX + 10, y = e.clientY + 10;
    if (x + popupWidth > viewportWidth) x = viewportWidth - popupWidth - 10;
    if (y + popupHeight > viewportHeight) y = viewportHeight - popupHeight - 10;
    setSelectedEvent(event);
    setPopupPosition({ x, y });
  };

  useEffect(() => {
    if (selectedEvent) {
      setForm({
        title: selectedEvent.title,
        doctor: selectedEvent.doctor,
        location: selectedEvent.location,
        start: moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm'),
        end: moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm'),
        color: selectedEvent.color || '#3174ad',
      });
    }
  }, [selectedEvent]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedEvent(null);
      }
    };
    if (selectedEvent) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedEvent]);

  const handleSave = () => {
    setEvents(events.map(e =>
      e.id === selectedEvent.id
        ? {
          ...e,
          title: form.title,
          doctor: form.doctor,
          location: form.location,
          start: new Date(form.start),
          end: new Date(form.end),
          color: form.color,
        }
        : e
    ));
    setSelectedEvent(null);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${selectedEvent.title}"?`)) {
      try {
        await axios.delete(`http://localhost:3001/api/scheduling/delete-scheduled-session/${selectedEvent.id}`);
        setEvents(events.filter(e => e.id !== selectedEvent.id));
        setSelectedEvent(null);
      } catch (err) {
        console.error("❌ Failed to delete from backend:", err);
        alert("Failed to delete from database.");
      }
    }
  };

  const moveEvent = ({ event, start, end }) => {
    setEvents(events.map(e => (e.id === event.id ? { ...e, start, end } : e)));
  };

  const resizeEvent = ({ event, start, end }) => {
    setEvents(events.map(e => (e.id === event.id ? { ...e, start, end } : e)));
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color || '#3174ad',
      borderRadius: '4px',
      opacity: 0.9,
      color: 'white',
      border: 'none',
    },
  });

  return (
    <>
      <div style={{ height: '80vh', padding: '20px' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={['month', 'week', 'agenda']}
          onSelectEvent={(event, e) => handleSelectEvent(event, e)}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          resizable
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {selectedEvent && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div ref={modalRef} style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 0 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2>Edit Event</h2>
            <label>Title:</label>
            <input className="edit-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <label>Doctor:</label>
            <input className="edit-input" value={form.doctor} onChange={e => setForm({ ...form, doctor: e.target.value })} />
            <label>Location:</label>
            <input className="edit-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <label>Start Time:</label>
            <input className="edit-input" type="datetime-local" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} />
            <label>End Time:</label>
            <input className="edit-input" type="datetime-local" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} />
            <label>Color:</label>
            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ width: '50px', height: '30px', border: 'none', cursor: 'pointer', padding: '0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={handleSave} style={{ backgroundColor: '#2e7d32', color: '#fff', padding: '10px 20px', borderRadius: '8px' }}>Save</button>
              <button onClick={handleDelete} style={{ backgroundColor: '#e53935', color: '#fff', padding: '10px 20px', borderRadius: '8px' }}>Delete</button>
              <button onClick={() => setSelectedEvent(null)} style={{ padding: '10px 20px', borderRadius: '8px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorScheduling;
