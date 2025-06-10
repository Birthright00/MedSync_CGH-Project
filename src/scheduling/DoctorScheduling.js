import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/DoctorScheduler.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const DoctorScheduling = () => {
  const [events, setEvents] = useState([
    {
      id: 0,
      title: 'Clinic with Dr. Tan',
      doctor: 'Dr. Tan',
      start: new Date(2025, 5, 6, 11, 0),
      end: new Date(2025, 5, 6, 12, 0),
      location: 'Ward 2B',
      color: '#31B5F7',
    },
    {
      id: 1,
      title: 'Ward Round with Dr. Lim',
      doctor: 'Dr. Lim',
      start: new Date(2025, 5, 7, 9, 0),
      end: new Date(2025, 5, 7, 10, 0),
      location: 'Ward 3C',
      color: '#BF51F9',
    },
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ title: '', doctor: '', location: '', start: '', end: '', color: '' });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

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

  const handleSelectEvent = (event, e) => {
    const popupWidth = 300;
    const popupHeight = 300;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = e.clientX + 10;
    let y = e.clientY + 10;

    if (x + popupWidth > viewportWidth) {
      x = viewportWidth - popupWidth - 10;
    }

    if (y + popupHeight > viewportHeight) {
      y = viewportHeight - popupHeight - 10;
    }

    setSelectedEvent(event);
    setPopupPosition({ x, y });
  };

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

  const handleDelete = () => {
    if (window.confirm(`Delete "${selectedEvent.title}"?`)) {
      setEvents(events.filter(e => e.id !== selectedEvent.id));
      setSelectedEvent(null);
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
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            ref={modalRef}
            style={{
              background: '#fff',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 0 20px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
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
            <input
              type="color"
              value={form.color}
              onChange={e => setForm({ ...form, color: e.target.value })}
              style={{
                width: '50px',
                height: '30px',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
              }}
            />


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
