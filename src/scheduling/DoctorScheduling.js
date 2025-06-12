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

const DoctorScheduling = ({ sessions, refreshSessions }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ title: '', doctor: '', location: '', start: '', end: '', color: '' });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
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
        isPast: endDate < new Date(),
      };
    });
    setEvents(mappedEvents);
  }, [sessions]);

  const parseDateAndTime = (dateStr, timeStr) => {
    const [day, monthName, year] = dateStr.split(' ');
    const month = monthStrToNum(monthName);

    let startHour = 9, startMinute = 0, endHour = 10, endMinute = 0;

    if (timeStr && timeStr !== "-" && timeStr !== "—") {
      const normalizedTimeStr = timeStr.replace(/\s*-\s*/g, '-').replace(/\s*to\s*/gi, '-');

      const rangeMatch = normalizedTimeStr.match(/^(.+?)-(.+)$/);
      if (rangeMatch) {
        const startTime = parseSingleTime(rangeMatch[1].trim());
        const endTime = parseSingleTime(rangeMatch[2].trim());
        startHour = startTime.hour;
        startMinute = startTime.minute;
        endHour = endTime.hour;
        endMinute = endTime.minute;
      } else {
        const singleTime = parseSingleTime(normalizedTimeStr);
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

  const handleSave = async () => {
    const updatedEvent = {
      ...selectedEvent,
      title: form.title,
      doctor: form.doctor,
      location: form.location,
      start: new Date(form.start),
      end: new Date(form.end),
    };

    setUndoStack(prev => [...prev, { before: selectedEvent, after: updatedEvent }]);
    setRedoStack([]); // clear redo on every new action

    try {
      await axios.patch(`http://localhost:3001/api/scheduling/update-scheduled-session/${selectedEvent.id}`, {
        title: form.title,
        doctor: form.doctor,
        location: form.location,
        start: form.start,
        end: form.end,
        color: form.color,
      });

      setSelectedEvent(null);
      if (refreshSessions) {
        await refreshSessions();
      }
    } catch (err) {
      console.error("❌ Failed to update backend:", err);
      alert("Failed to save changes to database.");
    }
  };



  const handleDelete = async () => {
    if (window.confirm(`Delete "${selectedEvent.title}"?`)) {
      setUndoStack(prev => [...prev, { before: selectedEvent, after: null }]);
      setRedoStack([]);

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


  const moveEvent = async ({ event, start, end }) => {
    const updatedEvent = {
      ...event,
      start,
      end,
    };
    setUndoStack(prev => [...prev, { before: event, after: updatedEvent }]);
    setRedoStack([]);

    try {
      await axios.patch(`http://localhost:3001/api/scheduling/update-scheduled-session/${event.id}`, {
        title: event.title,
        doctor: event.doctor,
        location: event.location,
        start: start.toISOString(),   // convert to ISO format for backend consistency
        end: end.toISOString(),
      });

      if (refreshSessions) {
        await refreshSessions();
      }
    } catch (err) {
      console.error("❌ Failed to update event after drag:", err);
    }
  };


  const resizeEvent = async ({ event, start, end }) => {
    const updatedEvent = {
      ...event,
      start,
      end,
    };
    setUndoStack(prev => [...prev, { before: event, after: updatedEvent }]);
    setRedoStack([]);

    try {
      await axios.patch(`http://localhost:3001/api/scheduling/update-scheduled-session/${event.id}`, {
        title: event.title,
        doctor: event.doctor,
        location: event.location,
        start: start.toISOString(),
        end: end.toISOString(),
      });

      if (refreshSessions) {
        await refreshSessions();
      }
    } catch (err) {
      console.error("❌ Failed to update event after resize:", err);
    }
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: '#3174ad',
      borderRadius: '4px',
      opacity: event.isPast ? 0.6 : 0.9,
      color: 'white',
      border: 'none',
      display: 'block',
      cursor: event.isPast ? 'not-allowed' : 'pointer'
    }
  });

  const handleUndo = async () => {
    if (undoStack.length === 0) {
      alert("Nothing to undo");
      return;
    }

    const lastAction = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, lastAction]);  // push full pair to redo

    if (lastAction.before) {
      await axios.patch(`http://localhost:3001/api/scheduling/update-scheduled-session/${lastAction.before.id}`, {
        title: lastAction.before.title,
        doctor: lastAction.before.doctor,
        location: lastAction.before.location,
        start: moment(lastAction.before.start).toISOString(),
        end: moment(lastAction.before.end).toISOString(),
      });
    } else {
      await axios.delete(`http://localhost:3001/api/scheduling/delete-scheduled-session/${lastAction.after.id}`);
    }

    setUndoStack(prev => prev.slice(0, -1));
    if (refreshSessions) await refreshSessions();
  };


  const handleRedo = async () => {
    if (redoStack.length === 0) {
      alert("Nothing to redo");
      return;
    }

    const nextAction = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, nextAction]);  // push back to undo

    if (nextAction.after) {
      await axios.patch(`http://localhost:3001/api/scheduling/update-scheduled-session/${nextAction.after.id}`, {
        title: nextAction.after.title,
        doctor: nextAction.after.doctor,
        location: nextAction.after.location,
        start: moment(nextAction.after.start).toISOString(),
        end: moment(nextAction.after.end).toISOString(),
      });
    } else {
      await axios.delete(`http://localhost:3001/api/scheduling/delete-scheduled-session/${nextAction.before.id}`);
    }

    setRedoStack(prev => prev.slice(0, -1));
    if (refreshSessions) await refreshSessions();
  };


  const CustomToolbar = ({ label, onNavigate, onView, undoAvailable, redoAvailable, onUndo, onRedo }) => {
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button onClick={() => onNavigate('PREV')}>Prev</button>
          <button onClick={() => onNavigate('TODAY')}>Today</button>
          <button onClick={() => onNavigate('NEXT')}>Next</button>
        </span>
        <span className="rbc-toolbar-label">{label}</span>
        <span className="rbc-btn-group">
          <button onClick={() => onView('month')}>Month</button>
          <button onClick={() => onView('week')}>Week</button>
          <button onClick={() => onView('agenda')}>Agenda</button>
        </span>

        <span className="rbc-btn-group">
          <button
            onClick={onUndo}
            disabled={!undoAvailable}
            style={{
              backgroundColor: undoAvailable ? '#1976d2' : '#cccccc',
              color: '#fff',
              marginRight: '5px',
              borderRadius: '6px',
              cursor: undoAvailable ? 'pointer' : 'not-allowed'
            }}
          >Undo</button>

          <button
            onClick={onRedo}
            disabled={!redoAvailable}
            style={{
              backgroundColor: redoAvailable ? '#388e3c' : '#cccccc',
              color: '#fff',
              borderRadius: '6px',
              cursor: undoAvailable ? 'pointer' : 'not-allowed'
            }}
          >Redo</button>
        </span>
      </div>
    );
  };




  return (
    <>
      <div style={{ height: '60vh', padding: '20px' }}>
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
          components={{
            toolbar: (props) => (
              <CustomToolbar
                {...props}
                undoAvailable={undoStack.length > 0}
                redoAvailable={redoStack.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
              />
            )
          }}
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
