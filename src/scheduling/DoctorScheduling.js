import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/DoctorScheduler.css';
import API_BASE_URL from '../apiConfig';
import { generateWalkaboutBlocks } from '../components/generateWalkabouts';


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
        originalTime: s.original_time,
        changeType: s.change_type,
        changeReason: s.change_reason,
      };
    });

    // Walkabout Blocks & Trimming
    const walkaboutBlocks = generateWalkaboutBlocks(mappedEvents);
    setEvents([...mappedEvents, ...walkaboutBlocks]);
  }, [sessions]);

  const parseDateAndTime = (dateStr, timeStr) => {
    const [day, monthName, year] = dateStr.split(' ');
    const month = monthStrToNum(monthName);

    let startHour = 9, startMinute = 0, endHour = 10, endMinute = 0;

    if (timeStr && timeStr !== "-" && timeStr !== "—") {
      let normalizedTimeStr = timeStr.replace(/\s*-\s*/g, '-').replace(/\s*to\s*/gi, '-').replace(/\./g, ':').toLowerCase();

      // Add AM/PM if missing — assume AM unless it's after 12
      const parts = normalizedTimeStr.split('-');
      if (!parts[0].includes('am') && !parts[0].includes('pm')) {
        const startHour = parseInt(parts[0].split(':')[0]);
        parts[0] += startHour >= 7 && startHour <= 11 ? 'am' : 'pm';
      }
      if (parts.length > 1 && !parts[1].includes('am') && !parts[1].includes('pm')) {
        const endHour = parseInt(parts[1].split(':')[0]);
        parts[1] += endHour >= 1 && endHour <= 6 ? 'pm' : 'am';
      }

      normalizedTimeStr = parts.join('-');


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
    const match = timeStr.match(/(\d{1,2})(?::?(\d{0,2}))?\s*(am|pm)/i);
    if (!match) {
      throw new Error(`Cannot parse time string: "${timeStr}"`);
    }
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const ampm = match[3].toLowerCase();

    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    return { hour, minute };
  };

  const monthStrToNum = (monthStr) => {
    const months = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };
    return months[monthStr.toLowerCase()] ?? 0;
  };


  const handleSelectEvent = (event, e) => {
    if (event.title === "Walkabout") return; // 🚫 no popup for walkabout
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

    const locationChanged = selectedEvent.location !== form.location;
    const timeChanged =
      moment(selectedEvent.start).toISOString() !== moment(form.start).toISOString() ||
      moment(selectedEvent.end).toISOString() !== moment(form.end).toISOString();
    const doctorChanged = selectedEvent.doctor !== form.doctor;
    const titleChanged = selectedEvent.title !== form.title;

    let change_type = null;
    let change_reason = "";


    if (locationChanged && timeChanged) {
      change_type = 'rescheduled';
      change_reason = 'Time and location changed by Education Office';
    } else if (locationChanged) {
      change_type = 'location_changed';
      change_reason = 'Location changed by Education Office';
    } else if (timeChanged) {
      change_type = 'rescheduled';
      change_reason = 'Manual time change by Education Office';

    } /*else if (doctorChanged) {
      change_type = 'doctor_changed';
      change_reason = 'Doctor updated by Education Office';
    } else if (titleChanged) {
      change_type = 'title_changed';
      change_reason = 'Tutorial title updated by Education Office';
    } */


    setUndoStack(prev => [...prev, { before: selectedEvent, after: updatedEvent, change_type: change_type, change_reason: change_reason, }]);
    setRedoStack([]); // clear redo on every new action

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${selectedEvent.id}`, {
        title: form.title,
        doctor: form.doctor,
        location: form.location,
        start: form.start,
        end: form.end,
        color: form.color,
        original_time: moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm'),
        change_type: change_type,
        change_reason: change_reason,
        is_read: 0,  // 👈 reset to unread
      },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

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
    if (selectedEvent.title === "Walkabout") return; // 🚫 don't delete walkabout
    if (window.confirm(`Delete "${selectedEvent.title}"?`)) {
      setUndoStack(prev => [...prev, { before: selectedEvent, after: null, change_type: 'deleted', change_reason: 'Deleted by user', }]);
      setRedoStack([]);

      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API_BASE_URL}/api/scheduling/delete-scheduled-session/${selectedEvent.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setEvents(events.filter(e => e.id !== selectedEvent.id));
        setSelectedEvent(null);
      } catch (err) {
        console.error("❌ Failed to delete from backend:", err);
        alert("Failed to delete from database.");
      }
    }
  };


  const moveEvent = async ({ event, start, end }) => {
    if (event.title === "Walkabout") return; // 🚫 prevent dragging walkabout
    const updatedEvent = {
      ...event,
      start,
      end,
    };
    setUndoStack(prev => [...prev, { before: event, after: updatedEvent, change_type: 'rescheduled', change_reason: 'Rescheduled via drag', }]);
    setRedoStack([]);

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${event.id}`, {
        title: event.title,
        doctor: event.doctor,
        location: event.location,
        start: start.toISOString(),   // convert to ISO format for backend consistency
        end: end.toISOString(),
        original_time: moment(event.start).format('YYYY-MM-DDTHH:mm'),
        change_type: 'rescheduled',
        change_reason: 'Rescheduled via drag',
        is_read: 0,  // 👈 reset to unread
      },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      if (refreshSessions) {
        await refreshSessions();
      }
    } catch (err) {
      console.error("❌ Failed to update event after drag:", err);
    }
  };


  const resizeEvent = async ({ event, start, end }) => {
    if (event.title === "Walkabout") return; // 🚫 prevent resizing walkabout
    const updatedEvent = {
      ...event,
      start,
      end,
    };
    setUndoStack(prev => [...prev, { before: event, after: updatedEvent, change_type: 'resized', change_reason: 'Duration adjusted by Education Office', }]);
    setRedoStack([]);

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${event.id}`, {
        title: event.title,
        doctor: event.doctor,
        location: event.location,
        start: start.toISOString(),
        end: end.toISOString(),
        original_time: moment(event.start).format('YYYY-MM-DDTHH:mm'),
        change_type: 'resized',
        change_reason: 'Duration adjusted by Education Office',
        is_read: 0,  // 👈 reset to unread
      },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      if (refreshSessions) {
        await refreshSessions();
      }
    } catch (err) {
      console.error("❌ Failed to update event after resize:", err);
    }
  };

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color || '#3174ad',
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
    setRedoStack(prev => [...prev, lastAction]);

    const isBackToOriginal =
      moment(lastAction.before.start).isSame(lastAction.after.start) &&
      moment(lastAction.before.end).isSame(lastAction.after.end) &&
      lastAction.before.title === lastAction.after.title &&
      lastAction.before.doctor === lastAction.after.doctor &&
      lastAction.before.location === lastAction.after.location;

    try {
      const token = localStorage.getItem("token");

      if (lastAction.after && isBackToOriginal) {
        // Undo to original — clear change_type & original_time
        await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${lastAction.before.id}`, {
          title: lastAction.before.title,
          doctor: lastAction.before.doctor,
          location: lastAction.before.location,
          start: moment(lastAction.before.start).toISOString(),
          end: moment(lastAction.before.end).toISOString(),
          change_type: null,
          change_reason: null,
          original_time: null,
          is_read: 1, // ✅ mark as read so it does NOT appear in StudentHomePage
          color: '#3174ad',  // ✅ revert color to original blue
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Normal undo
        await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${lastAction.before.id}`, {
          title: lastAction.before.title,
          doctor: lastAction.before.doctor,
          location: lastAction.before.location,
          start: moment(lastAction.before.start).toISOString(),
          end: moment(lastAction.before.end).toISOString(),
          original_time: moment(lastAction.after?.start ?? lastAction.before.start).format('YYYY-MM-DDTHH:mm'),
          change_type: lastAction.change_type,
          change_reason: `Undo: ${lastAction.change_reason}`,
          is_read: 0,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setUndoStack(prev => prev.slice(0, -1));
      if (refreshSessions) await refreshSessions();
    } catch (err) {
      console.error("Undo failed:", err);
    }
  };



  const handleRedo = async () => {
    if (redoStack.length === 0) {
      alert("Nothing to redo");
      return;
    }

    const nextAction = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, nextAction]);  // push back to undo

    const isBackToOriginal =
      moment(nextAction.before.start).isSame(nextAction.after.start) &&
      moment(nextAction.before.end).isSame(nextAction.after.end) &&
      nextAction.before.title === nextAction.after.title &&
      nextAction.before.doctor === nextAction.after.doctor &&
      nextAction.before.location === nextAction.after.location;

    try {
      const token = localStorage.getItem("token");

      if (nextAction.before && isBackToOriginal) {
        // Redo returns to original state — clear all change markers
        await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${nextAction.after.id}`, {
          title: nextAction.after.title,
          doctor: nextAction.after.doctor,
          location: nextAction.after.location,
          start: moment(nextAction.after.start).toISOString(),
          end: moment(nextAction.after.end).toISOString(),
          change_type: null,
          change_reason: null,
          original_time: null,
          is_read: 1, // ✅ mark as read so it does NOT appear in StudentHomePage
          color: '#3174ad',  // ✅ revert color to original blue
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Normal redo
        await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${nextAction.after.id}`, {
          title: nextAction.after.title,
          doctor: nextAction.after.doctor,
          location: nextAction.after.location,
          start: moment(nextAction.after.start).toISOString(),
          end: moment(nextAction.after.end).toISOString(),
          original_time: moment(nextAction.before?.start ?? nextAction.after.start).format('YYYY-MM-DDTHH:mm'),
          change_type: nextAction.change_type,
          change_reason: `Redo: ${nextAction.change_reason}`,
          is_read: 0,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setRedoStack(prev => prev.slice(0, -1));
      if (refreshSessions) await refreshSessions();
    } catch (err) {
      console.error("❌ Failed to redo:", err);
    }
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
          <button onClick={() => onView('work_week')}>Week</button>
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
      <div style={{ height: '70vh', padding: '0px' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WORK_WEEK}
          views={['month', 'work_week', 'agenda']}
          min={new Date(1970, 1, 1, 8, 0)}   // <-- Start at 8:00 AM
          max={new Date(1970, 1, 1, 18, 0)}  // <-- End at 6:00 PM
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
          <div ref={modalRef} style={{ background: '#fff', padding: '30px 40px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 0 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
