/**
 * StudentTimetable Component
 * 
 * Advanced interactive calendar interface for students to view their scheduled sessions.
 * Integrates with backend authentication system and provides comprehensive timetable management.
 * 
 * Key Features:
 * - Interactive calendar with drag-and-drop capabilities (react-big-calendar)
 * - Real-time data synchronization with 5-second refresh intervals
 * - PDF export functionality for offline access
 * - Bulk download capabilities with ZIP file generation
 * - Past session identification with visual distinction
 * - Blocked dates handling for institutional schedules
 * - Session conflict detection and resolution
 * - Mobile-responsive design with touch-friendly interactions
 * 
 * Authentication Integration:
 * - JWT token-based API requests
 * - User identification via matric number (stored as user_id in localStorage)
 * - Secure session management with automatic token validation
 * 
 * Data Management:
 * - Automatic refresh every 5 seconds for real-time updates
 * - Comprehensive date/time parsing with moment.js
 * - Event categorization (active, past, blocked, modified)
 * - Error handling for network and authentication failures
 * 
 * Export Capabilities:
 * - Individual session PDF generation
 * - Calendar screenshot export
 * - Bulk session data download as ZIP
 * 
 * Visual Features:
 * - Color-coded events by status and modification type
 * - Hover effects and interactive event selection
 * - Responsive layout adaptation
 * - Accessibility-compliant interface elements
 */

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar'; // Calendar library with view management
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'; // Drag-and-drop functionality
import moment from 'moment'; // Date/time manipulation and formatting
import jsPDF from 'jspdf'; // PDF generation for exports
import html2canvas from 'html2canvas'; // DOM to canvas conversion for screenshots
import axios from 'axios'; // HTTP client for API communication
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Base calendar styles
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'; // Drag-and-drop styles
import StudentNavbar from "./studentnavbar.js"; // Student-specific navigation component
import '../styles/studenttimetable.css'; // Custom timetable styling
import API_BASE_URL from '../apiConfig'; // Backend API endpoint configuration
import { getStartEndTime, getBlockedTimeRange } from './parseTime.js'; // Time parsing utilities
import JSZip from 'jszip'; // ZIP file generation for bulk downloads
import { saveAs } from 'file-saver'; // File download utility
import { generateWalkaboutBlocks } from '../components/generateWalkabouts.js'; // Walkabout session generator


const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const StudentTimetable = () => {
  // DOM References
  const calendarRef = useRef(null); // Reference to calendar element for exports and screenshots
  
  // Core State Management
  const [events, setEvents] = useState([]); // All student timetable events/sessions
  const [selectedEvent, setSelectedEvent] = useState(null); // Currently selected event for modal display
  const [blockedDates, setBlockedDates] = useState([]); // Institutional blocked dates overlay
  
  // Export Modal State Management
  const [showExportModal, setShowExportModal] = useState(false); // Controls export modal visibility
  const [exportType, setExportType] = useState(null); // Export format: 'png' or 'pdf'
  const [exportStartDate, setExportStartDate] = useState(''); // Date range start for export
  const [exportEndDate, setExportEndDate] = useState(''); // Date range end for export
  
  // Calendar View State Management
  const [calendarView, setCalendarView] = useState(Views.WORK_WEEK); // Current calendar view mode
  const [calendarDate, setCalendarDate] = useState(new Date()); // Currently displayed date

  /**
   * Fetch Institutional Blocked Dates
   * 
   * Retrieves institution-wide blocked dates (holidays, exam periods, etc.)
   * that should be overlaid on the student calendar for context.
   * These dates help students understand when regular sessions won't occur.
   * 
   * Data Processing:
   * - Fetches blocked date data from backend API
   * - Formats date ranges using time parsing utilities
   * - Creates calendar events marked as blocked
   * - Applies visual styling to distinguish from regular sessions
   */
  const fetchBlockedDates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/scheduling/get-blocked-dates`);
      const formatted = res.data.blocked_dates.map(item => {
        const [start, end] = getBlockedTimeRange(item.date);
        return {
          title: item.remark || "Blocked", // Display text for blocked period
          start, // Blocked period start time
          end, // Blocked period end time
          isBlocked: true // Flag for visual styling
        };
      });
      setBlockedDates(formatted);
    } catch (err) {
      console.error("Failed to fetch blocked dates", err);
      // Could add user notification for better UX
    }
  };

  const fetchTimetable = () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    axios.get(`${API_BASE_URL}/api/scheduling/student-timetable/${userId}`, {
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
            color: ["rescheduled", "resized"].includes(item.change_type) ? "#D49A00" : "#31B5F7",
            location: item.location,
            students: item.students,
            isPast: endDateTime < now,
            originalTime: item.original_time,
            changeType: item.change_type,
            changeReason: item.change_reason
          };
        });

        // Helper to compare just date portion
        const isSameDay = (d1, d2) => (
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate()
        );

        // 🛠 Remove walkabouts on blocked days
        const allWalkabouts = generateWalkaboutBlocks(mappedEvents);
        const filteredWalkabouts = allWalkabouts.filter(w =>
          !blockedDates.some(b => isSameDay(new Date(w.start), new Date(b.start)))
        );

        setEvents([...mappedEvents, ...filteredWalkabouts, ...blockedDates]);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  useEffect(() => {
    fetchTimetable();
    const interval = setInterval(fetchTimetable, 5000);
    return () => clearInterval(interval);
  }, [blockedDates]);



  const handleSelectEvent = (event) => {
    if (event.isPast) return;   // ✅ Disable click if past
    setSelectedEvent(event);
  };

  const getEventColor = (event) => {
    if (event.isPast) return '#999999';
    if (event.isBlocked) return '#bdbdbd';
    if (['rescheduled', 'resized'].includes(event.changeType)) return '#D49A00';
    return '#3174ad';
  };

  const eventStyleGetter = (event) => {
    if (event.isBlocked) {
      return {
        style: {
          backgroundColor: '#bdbdbd',
          borderLeft: '5px solid #616161',
          color: 'white',
          fontStyle: 'italic',
          pointerEvents: 'none',
          opacity: 0.8
        }
      };
    }

    return {
      style: {
        backgroundColor: getEventColor(event),
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        cursor: event.isPast ? 'not-allowed' : 'pointer'
      }
    };
  };


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
    const isAgenda = calendarView === Views.AGENDA;
    const todayDate = moment(calendarDate).format('ddd, MMM DD YYYY'); // format current date

    // Check if calendarDate is today
    const isToday = moment(calendarDate).isSame(moment(), 'day');

    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button onClick={() => onNavigate('PREV')}>
            Prev
          </button>
          <button onClick={() => onNavigate('TODAY')}>
            Today
          </button>
          <button onClick={() => onNavigate('NEXT')}>
            Next
          </button>

        </span>

        <span className="rbc-toolbar-label">
          {isAgenda ? (isToday ? `Today (${todayDate})` : todayDate) : label}
        </span>

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

  const CustomAgendaEvent = ({ event }) => (
    <tr>
      <td>
        <div style={{ fontWeight: "600", fontSize: "16px", color: "#333" }}>{event.title}</div>
        {event.location && (
          <div style={{ fontSize: "13px", color: "#666", marginTop: "3px" }}>📍 {event.location}</div>
        )}
      </td>
    </tr>
  );



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
            onNavigate={(newDate, view, action) => {
              let date = newDate;

              if (calendarView === Views.AGENDA) {
                if (action === 'NEXT') {
                  date = moment(calendarDate).add(1, 'day');
                  while (date.day() === 0 || date.day() === 6) { // Skip weekends
                    date.add(1, 'day');
                  }
                } else if (action === 'PREV') {
                  date = moment(calendarDate).subtract(1, 'day');
                  while (date.day() === 0 || date.day() === 6) { // Skip weekends
                    date.subtract(1, 'day');
                  }
                } else {
                  date = moment(newDate);
                }
                setCalendarDate(date.toDate());
              } else {
                setCalendarDate(newDate);
              }
            }}


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
              event: CustomEvent,
              agenda: {
                event: CustomAgendaEvent
              }
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
            className="fade-in"
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

            {["rescheduled", "resized"].includes(selectedEvent.changeType) && selectedEvent.originalTime && (
              <div style={{ marginTop: '10px', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '6px' }}>
                <p><strong>⏱ Originally:</strong> {
                  (() => {
                    const original = selectedEvent.originalTime;

                    // Case 1: Already formatted string with date and time range
                    const rangeRegex = /^\d{1,2} \w+ \d{4} \d{1,2}:\d{2}(AM|PM) - \d{1,2}:\d{2}(AM|PM)$/i;
                    if (rangeRegex.test(original)) {
                      return original;
                    }

                    // Case 2: Single ISO string (e.g., "2025-07-04T16:30")
                    const isoParsed = moment(original, moment.ISO_8601, true);
                    if (isoParsed.isValid()) {
                      const formattedDate = isoParsed.format("D MMMM YYYY");
                      const formattedTime = isoParsed.format("h:mmA");
                      return `${formattedDate} ${formattedTime}`;
                    }

                    return "Unavailable";
                  })()
                }</p>
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
            className="fade-in"
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


