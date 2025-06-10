import React, { useState, useEffect } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import StudentNavbar from "./studentnavbar.js";
import '../styles/studenttimetable.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const StudentTimetable = () => {
  const [events] = useState([
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

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
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
    <>
      <StudentNavbar />
      <div style={{ height: '80vh', padding: '20px' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView={Views.WEEK}
          views={['month', 'week', 'agenda']}
          selectable={false}
          resizable={false}
          draggableAccessor={() => false}
          onEventDrop={() => {}}
          onEventResize={() => {}}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100vw',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
          onClick={() => setSelectedEvent(null)} // close modal if clicked outside the box
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '10px',
              boxShadow: '0px 4px 10px rgba(0,0,0,0.3)',
              maxWidth: '400px',
              width: '90%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()} // prevent close on inner click
          >
            <h2 style={{ marginTop: 0 }}>{selectedEvent.title}</h2>
            <p><strong>Start:</strong> {moment(selectedEvent.start).format('YYYY-MM-DD HH:mm')}</p>
            <p><strong>End:</strong> {moment(selectedEvent.end).format('YYYY-MM-DD HH:mm')}</p>

            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentTimetable;
