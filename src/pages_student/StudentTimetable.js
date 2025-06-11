import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import StudentNavbar from "./studentnavbar.js";
import '../styles/studenttimetable.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const StudentTimetable = () => {
  const calendarRef = useRef(null);

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

  const exportAsImage = () => {
    html2canvas(calendarRef.current).then((canvas) => {
      const link = document.createElement('a');
      link.download = 'timetable.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const exportAsPDF = () => {
    html2canvas(calendarRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('timetable.pdf');
    });
  };

  return (
    <>
      <StudentNavbar />
      <div style={{ padding: '20px' }} ref={calendarRef}>
        <div style={{ height: '70vh', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', background: 'white'  }}>
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
            onEventDrop={() => { }}
            onEventResize={() => { }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
          />
        </div>

        <div className="export-buttons" style={{ textAlign: 'center', margin: '20px 0' }} >
          <button onClick={exportAsImage} style={{ marginRight: '10px' }}>Save as PNG</button>
          <button onClick={exportAsPDF}>Save as PDF</button>
        </div>
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
