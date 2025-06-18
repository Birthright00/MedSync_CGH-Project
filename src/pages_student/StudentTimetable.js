import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import StudentNavbar from "./studentnavbar.js";
import '../styles/studenttimetable.css';
import API_BASE_URL from '../apiConfig';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const StudentTimetable = () => {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const normalizeTime = (timeStr, defaultAmPm = "am") => {
    if (!timeStr) return null;
    timeStr = timeStr.trim().toLowerCase().replace(/[:.]/g, '');

    if (timeStr.includes("am") || timeStr.includes("pm")) {
      return timeStr.toUpperCase();
    }
    return `${timeStr}${defaultAmPm}`.toUpperCase();
  };

  const fetchTimetable = () => {
    axios.get(`${API_BASE_URL}/api/scheduling/timetable`)
      .then(res => {
        const now = new Date();

        const mappedEvents = res.data.map(item => {
          let startTimeStr = "9am";
          let endTimeStr = "10am";

          if (item.time) {
            const normalized = item.time.toLowerCase().replace(/\s*to\s*/g, '-').replace(/\s*-\s*/g, '-');
            const timeParts = normalized.split('-').map(t => t.trim());
            startTimeStr = normalizeTime(timeParts[0], "am");

            if (timeParts[1]) {
              endTimeStr = normalizeTime(timeParts[1], startTimeStr.includes("PM") ? "pm" : "am");
            } else {
              endTimeStr = moment(startTimeStr, "hA").add(1, "hour").format("hA");
            }
          }

          const startDateTime = moment(`${item.date} ${startTimeStr}`, ["D MMMM YYYY hmmA", "D MMMM YYYY hA"]).toDate();
          const endDateTime = moment(`${item.date} ${endTimeStr}`, ["D MMMM YYYY hmmA", "D MMMM YYYY hA"]).toDate();


          return {
            id: item.id,
            title: `${item.session_name} (${item.name})`,
            start: startDateTime,
            end: endDateTime,
            // ✅ CHANGED: color based on rescheduled status
            color: ["rescheduled", "resized"].includes(item.change_type) ? "#fdd835" : "#31B5F7",
            location: item.location,
            students: item.students,
            isPast: endDateTime < now,
            originalTime: item.original_time,
            changeType: item.change_type,
            changeReason: item.change_reason
          };
        });

        setEvents(mappedEvents);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTimetable();
    const interval = setInterval(fetchTimetable, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectEvent = (event) => {
    if (event.isPast) return;   // ✅ Disable click if past
    setSelectedEvent(event);
  };


  const getEventColor = (event) => {
    if (event.isPast) return '#999999';
    if (['rescheduled', 'resized'].includes(event.changeType)) return '#fdd835';
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
      cursor: event.isPast ? 'not-allowed' : 'pointer'
    }
  });


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

  const CustomToolbar = ({ label, onNavigate, onView }) => {
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
      </div>
    );
  };


  return (
    <>
      <StudentNavbar />
      <div style={{ padding: '20px' }} ref={calendarRef}>
        <div style={{ height: '70vh', border: '1px solid #ddd', borderRadius: '8px', padding: '10px', background: 'white' }}>
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView={Views.WORK_WEEK}
            views={['month', 'work_week', 'agenda']}
            min={new Date(1970, 1, 1, 8, 0)}
            max={new Date(1970, 1, 1, 18, 0)}
            selectable={false}
            resizable={false}
            draggableAccessor={() => false}
            onEventDrop={() => { }}
            onEventResize={() => { }}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar   // <-- inject custom toolbar here
            }}
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
          onClick={() => setSelectedEvent(null)}
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
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>{selectedEvent.title}</h2>
            <p><strong>Start:</strong> {moment(selectedEvent.start).format('YYYY-MM-DD HH:mm')}</p>
            <p><strong>End:</strong> {moment(selectedEvent.end).format('YYYY-MM-DD HH:mm')}</p>
            <p><strong>Location:</strong> {selectedEvent.location}</p>
            <p><strong>Students:</strong> {selectedEvent.students}</p>

            {["rescheduled", "resized"].includes(selectedEvent.changeType) && (
              <div style={{ marginTop: '10px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '6px' }}>
                <p><strong>⏱ Originally:</strong> {moment(selectedEvent.originalTime).format('DD/MM/YYYY [at] hh:mm A')}</p>
              </div>
            )}


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
