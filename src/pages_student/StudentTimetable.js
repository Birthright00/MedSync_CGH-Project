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
import { getStartEndTime } from './parseTime.js'; // Import the function to parse time
import JSZip from 'jszip';
import { saveAs } from 'file-saver'; // also install: npm install file-saver


const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const StudentTimetable = () => {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState(null); // 'png' or 'pdf'
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [calendarView, setCalendarView] = useState(Views.WORK_WEEK);
  const [calendarDate, setCalendarDate] = useState(new Date());

  const fetchTimetable = () => {
    const token = localStorage.getItem("token");
    axios.get(`${API_BASE_URL}/api/scheduling/timetable`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    })
      .then(res => {
        const now = new Date();

        const mappedEvents = res.data.map(item => {
          const [startTimeStr, endTimeStr] = getStartEndTime(item.time);

          console.log("Item Time:", item.time, "→ Start:", startTimeStr, "End:", endTimeStr);
          // Parse date and time together
          const startDateTime = moment(`${item.date} ${startTimeStr}`, ["D MMMM YYYY h:mmA", "D MMMM YYYY hA"]).toDate();
          const endDateTime = moment(`${item.date} ${endTimeStr}`, ["D MMMM YYYY h:mmA", "D MMMM YYYY hA"]).toDate();

          return {
            id: item.id,
            title: `${item.session_name} (${item.name})`,
            start: startDateTime,
            end: endDateTime,
            // ✅ CHANGED: color based on rescheduled status
            color: ["rescheduled", "resized"].includes(item.change_type) ? "#D49A00" : "#31B5F7",
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
      cursor: event.isPast ? 'not-allowed' : 'pointer'
    }
  });

  const exportAsImage = async () => {
    const start = moment(exportStartDate).startOf('day');
    const end = moment(exportEndDate).endOf('day');

    const zip = new JSZip();
    const container = calendarRef.current;
    const originalHeight = container.style.height;
    const originalDate = calendarDate;
    const originalView = calendarView;

    // 📦 Work_Week Export (multi-week PNGs)
    if (calendarView === Views.WORK_WEEK) {
      let weekCursor = moment(start);
      let weekIndex = 1;

      setCalendarView(Views.WORK_WEEK);

      while (weekCursor.isSameOrBefore(end, 'week')) {
        setCalendarDate(weekCursor.toDate());

        await new Promise(resolve => setTimeout(resolve, 700));
        container.style.height = 'auto';

        const canvas = await html2canvas(container, { scale: 2 });
        const dataURL = canvas.toDataURL('image/png');

        zip.file(`timetable_week${weekIndex}.png`, dataURL.split(',')[1], { base64: true });

        weekIndex++;
        weekCursor.add(1, 'week');
      }
    }

    // 📦 Agenda View Export (single PNG over date range)
    else if (calendarView === Views.AGENDA) {
      setCalendarView(Views.AGENDA);
      setCalendarDate(start.toDate());

      await new Promise(resolve => setTimeout(resolve, 700));
      container.style.height = 'auto';

      const canvas = await html2canvas(container, { scale: 2 });
      const dataURL = canvas.toDataURL('image/png');

      zip.file(`timetable_agenda_${start.format("YYYYMMDD")}_to_${end.format("YYYYMMDD")}.png`, dataURL.split(',')[1], { base64: true });
    }

    // 📦 Month View Export (single PNG)
    else {
      setCalendarView(Views.MONTH);
      setCalendarDate(start.toDate());

      await new Promise(resolve => setTimeout(resolve, 700));
      container.style.height = 'auto';

      const canvas = await html2canvas(container, { scale: 2 });
      const dataURL = canvas.toDataURL('image/png');

      zip.file(`timetable_month_${start.format("YYYYMMDD")}.png`, dataURL.split(',')[1], { base64: true });
    }

    // 🎯 Restore State
    container.style.height = originalHeight;
    setCalendarDate(originalDate);
    setCalendarView(originalView);

    // 📥 Trigger ZIP Download
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, 'timetable_export.zip');
    });
  };

  const exportAsPDF = async () => {
    const start = moment(exportStartDate).startOf('day');
    const end = moment(exportEndDate).endOf('day');

    const pdf = new jsPDF('landscape');
    const container = calendarRef.current;
    const originalDate = calendarDate;
    const originalView = calendarView;
    const originalHeight = container.style.height;

    // Case A: Weekly export (multi-page)
    if (calendarView === Views.WORK_WEEK) {
      let firstPage = true;
      const weekCursor = moment(start);

      setCalendarView(Views.WORK_WEEK);

      while (weekCursor.isSameOrBefore(end, 'week')) {
        setCalendarDate(weekCursor.toDate());
        await new Promise(resolve => setTimeout(resolve, 600));

        container.style.height = 'auto';

        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (!firstPage) pdf.addPage();
        firstPage = false;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        weekCursor.add(1, 'week');
      }
    }

    // Case B: Agenda view (single page)
    else if (calendarView === Views.AGENDA) {
      setCalendarView(Views.AGENDA);
      setCalendarDate(start.toDate());

      await new Promise(resolve => setTimeout(resolve, 700));
      container.style.height = 'auto';

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    // Case C: Month view
    else {
      setCalendarView(Views.MONTH);
      setCalendarDate(start.toDate());

      await new Promise(resolve => setTimeout(resolve, 600));
      container.style.height = 'auto';

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    }

    pdf.save('timetable.pdf');

    // Restore state
    container.style.height = originalHeight;
    setCalendarDate(originalDate);
    setCalendarView(originalView);
  };


  const handleExport = async () => {
    const start = moment(exportStartDate).startOf('day');
    const end = moment(exportEndDate).endOf('day');

    const filteredEvents = events.filter(event =>
      moment(event.start).isSameOrAfter(start) &&
      moment(event.end).isSameOrBefore(end)
    );

    // Backup state
    const backupEvents = [...events];
    const backupDate = calendarDate;
    const backupView = calendarView;

    setEvents(filteredEvents);
    setShowExportModal(false);

    if (exportType === 'png') {
      await exportAsImage();
      setEvents(backupEvents);
      setCalendarDate(backupDate);
      setCalendarView(backupView);
      return;
    }


    if (exportType === 'pdf') {
      await exportAsPDF();
      setEvents(backupEvents);
      setCalendarDate(backupDate);
      setCalendarView(backupView);
      return;
    }
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

  const CustomEvent = ({ event }) => {
    return (
      <div>
        <div><strong>{event.title}</strong></div>
        {event.location && (
          <div style={{ fontSize: '0.75em', marginTop: '2px' }}>
            📍 {event.location}
          </div>
        )}
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
            view={calendarView}
            length={
              calendarView === Views.AGENDA
                ? moment(exportEndDate).diff(moment(exportStartDate), 'days') + 1
                : undefined
            }
            onView={view => setCalendarView(view)}
            date={calendarDate}
            onNavigate={date => setCalendarDate(date)}
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
              toolbar: CustomToolbar,   // <-- inject custom toolbar here
              event: CustomEvent
            }}
          />
        </div>

        <div className="export-buttons" style={{ textAlign: 'center', margin: '20px 0' }}>
          <button onClick={() => { setExportType('png'); setShowExportModal(true); }} style={{ marginRight: '10px' }}>
            Save as PNG
          </button>
          <button onClick={() => { setExportType('pdf'); setShowExportModal(true); }}>
            Save as PDF
          </button>
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

      {showExportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{ background: 'white', padding: '20px', borderRadius: '10px', width: '300px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Select Date Range</h3>
            <label>Start Date:</label>
            <input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
            <br /><br />
            <label>End Date:</label>
            <input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
            <br /><br />
            <button
              onClick={() => handleExport()}
              disabled={!exportStartDate || !exportEndDate}
            >
              Export
            </button>
            <button onClick={() => setShowExportModal(false)} style={{ marginLeft: '10px' }}>Cancel</button>
          </div>
        </div>
      )}

    </>
  );
};

export default StudentTimetable;


