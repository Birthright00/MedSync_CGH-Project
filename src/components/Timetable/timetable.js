import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const Timetable = () => {
  const [events, setEvents] = useState([
    {
      id: 0,
      title: 'Clinic',
      start: new Date(2025, 5, 6, 11, 0),
      end: new Date(2025, 5, 6, 12, 0),
      color: '#31B5F7',
    },
    {
      id: 1,
      title: 'Ward Round',
      start: new Date(2025, 5, 7, 9, 0),
      end: new Date(2025, 5, 7, 10, 0),
      color: '#BF51F9',
    },
  ]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ title: '', start: '', end: '', color: '' });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    if (selectedEvent) {
      setForm({
        title: selectedEvent.title,
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
    setSelectedEvent(event);
    setPopupPosition({ x: e.pageX, y: e.pageY });
  };

  const handleSave = () => {
    setEvents(events.map((e) =>
      e.id === selectedEvent.id
        ? {
            ...e,
            title: form.title,
            start: new Date(form.start),
            end: new Date(form.end),
            color: form.color,
          }
        : e
    ));
    setSelectedEvent(null);
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(`Delete '${selectedEvent.title}'?`);
    if (confirmDelete) {
      setEvents(events.filter((e) => e.id !== selectedEvent.id));
      setSelectedEvent(null);
    }
  };

  const moveEvent = ({ event, start, end }) => {
    setEvents(events.map(e => (e.id === event.id ? { ...e, start, end } : e)));
  };

  const resizeEvent = ({ event, start, end }) => {
    setEvents(events.map(e => (e.id === event.id ? { ...e, start, end } : e)));
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || '#3174ad',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  return (
    <div>
      <div style={{ height: '80vh' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={['month', 'week', 'agenda']}
          onEventDrop={moveEvent}
          onEventResize={resizeEvent}
          resizable
          onSelectEvent={(event, e) => handleSelectEvent(event, e)}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {selectedEvent && (
        <div
          ref={modalRef}
          style={{
            position: 'absolute',
            top: popupPosition.y + 10,
            left: popupPosition.x + 10,
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0px 0px 10px rgba(0,0,0,0.2)',
            zIndex: 1000,
            maxWidth: '300px'
          }}
        >
          <h3>Edit Event</h3>
          <label>Title:</label><br />
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          /><br />
          <label>Start:</label><br />
          <input
            type="datetime-local"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
          /><br />
          <label>End:</label><br />
          <input
            type="datetime-local"
            value={form.end}
            onChange={(e) => setForm({ ...form, end: e.target.value })}
          /><br />
          <label>Color:</label><br />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          /><br /><br />
          <button onClick={handleSave}>Save</button>
          <button
            onClick={handleDelete}
            style={{ marginLeft: '10px', backgroundColor: '#e74c3c', color: '#fff' }}
          >
            Delete
          </button>
          <button onClick={() => setSelectedEvent(null)} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Timetable;
