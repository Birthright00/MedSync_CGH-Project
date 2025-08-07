import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Calendar, Views, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import Select from "react-select";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/DoctorScheduler.css';
import * as XLSX from 'xlsx';
import API_BASE_URL from '../apiConfig';
import { generateWalkaboutBlocks } from '../components/generateWalkabouts';
import { parseBlockedDates } from '../components/parseBlockedDates';


const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

const DoctorScheduling = ({ sessions, refreshSessions }) => {
  const [uploadSchool, setUploadSchool] = useState('');
  const [uploadYear, setUploadYear] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({ title: '', doctor: '', location: '', start: '', end: '', color: '', students: [] });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [allStudentNames, setAllStudentNames] = useState([]);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const [showManualSessionModal, setShowManualSessionModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    session_name: "",
    name: "",
    doctor_email: "",
    date: "",
    time: "",
    location: "",
    students: "",
    change_reason: ""
  });


  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const isDateBlocked = (date) => {
    return blockedDates.some(b => isSameDay(b.start, date));
  };


  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/scheduling/get-blocked-dates`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });

        const dates = res.data.blocked_dates.map(entry => {
          const dateOnly = new Date(entry.date);
          // Important: force start at 00:00 and end at 23:59 so it's visible on calendar
          return {
            start: new Date(dateOnly.setHours(0, 0, 0, 0)),
            end: new Date(dateOnly.setHours(23, 59, 59, 999)),
            remark: entry.remark
          };
        });

        setBlockedDates(dates);
      } catch (err) {
        console.error("❌ Failed to fetch blocked dates", err);
      }
    };

    fetchBlockedDates();
  }, []);

  useEffect(() => {
    const fetchAllStudents = async () => {
      const adid = localStorage.getItem("adid"); // ✅ move here
      if (!adid) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/students`, {
          params: { adid }
        });


        setAllStudentNames(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch student names:", err);
      }
    };

    fetchAllStudents();
  }, []);


  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/doctors`);
        const formatted = res.data.map(doc => ({
          label: `${doc.name} (${doc.email})`,
          value: {
            name: doc.name,
            email: doc.email
          }
        }));
        setDoctorOptions(formatted);
      } catch (err) {
        console.error("❌ Failed to fetch doctors:", err);
      }
    };

    fetchDoctors();
  }, []);




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
    const walkaboutBlocks = generateWalkaboutBlocks(mappedEvents).filter(w => {
      return !blockedDates.some(b => isSameDay(w.start, b.start));
    });


    const blockedDateEvents = blockedDates.map((d, idx) => ({
      id: `blocked-${idx}`,
      title: d.remark?.trim() ? d.remark : 'Blocked',
      start: d.start,
      end: d.end,
      isBlocked: true,
    }));

    setEvents([...mappedEvents, ...walkaboutBlocks, ...blockedDateEvents]);
  }, [sessions, blockedDates]);

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

  const handleExcelSubmit = async () => {
    if (!uploadFile || !uploadSchool || !uploadYear) {
      alert("Please select file, school, and year.");
      return;
    }

    try {
      const blockedDates = await parseBlockedDates(uploadFile); // ✅ use raw file
      console.log("📤 Sending blocked dates to backend:", blockedDates, uploadSchool, uploadYear);

      await axios.post(`${API_BASE_URL}/api/scheduling/update-blocked-dates`, {
        blocked_dates: blockedDates,
        school: uploadSchool,
        yearofstudy: uploadYear,
      });

      alert("✅ Blocked dates updated");
      window.location.reload();
    } catch (err) {
      console.error("❌ Failed to update blocked dates", err);
      alert("❌ Error updating blocked dates");
    }
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
    const fetchAndSetForm = async () => {
      if (!selectedEvent) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/api/scheduling/get-students-for-session/${selectedEvent.id}`);
        const students = res.data.students || [];

        setForm({
          title: selectedEvent.title,
          doctor: selectedEvent.doctor,
          location: selectedEvent.location,
          start: moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm'),
          end: moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm'),
          color: selectedEvent.color || '#3174ad',
          students: [...new Set(students.map(s => s.trim()))] // ✅ Ensure uniqueness and no empty string
        });
      } catch (err) {
        console.error("❌ Failed to fetch students for session:", err);
        setForm({
          title: selectedEvent.title,
          doctor: selectedEvent.doctor,
          location: selectedEvent.location,
          start: moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm'),
          end: moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm'),
          color: selectedEvent.color || '#3174ad',
          students: []
        });
      }
    };

    fetchAndSetForm();
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
    const newStart = new Date(form.start);
    const newEnd = new Date(form.end);
    if (isDateBlocked(newStart) || isDateBlocked(newEnd)) {
      alert("⛔ Cannot schedule session on a blocked date.");
      return;
    }

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

    const startHour = new Date(form.start).getHours();
    const endHour = new Date(form.end).getHours();

    if (startHour < 8 || endHour > 18 || startHour >= endHour) {
      alert("⛔ Please choose a time between 8:00 AM and 6:00 PM.");
      return;
    }


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
        doctor_email: form.doctor_email,
        location: form.location,
        start: form.start,
        end: form.end,
        color: form.color,
        original_time: moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm'),
        change_type: change_type,
        change_reason: change_reason,
        is_read: 0,  // 👈 reset to unread
        students: form.students.join(", ")
      },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      // ✅ Re-fetch updated students from backend
      const res = await axios.get(`${API_BASE_URL}/api/scheduling/get-students-for-session/${selectedEvent.id}`);
      const updatedStudents = res.data.students || [];

      // ✅ Update frontend state with latest data
      setForm((prev) => ({
        ...prev,
        students: [...new Set(updatedStudents.map((s) => s.trim()))]
      }));

      // ✅ Optional update to selectedEvent if it's reused
      setSelectedEvent(prev => ({
        ...prev,
        students: updatedStudents.join(", ")
      }));

      // ✅ Refresh calendar if needed
      if (refreshSessions) {
        await refreshSessions();
      }

      setSelectedEvent(null); // close modal
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
    if (isDateBlocked(start) || isDateBlocked(end)) {
      alert("⛔ Cannot move event to a blocked date.");
      return;
    }

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
        doctor_email: form.doctor_email,
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
    if (isDateBlocked(start) || isDateBlocked(end)) {
      alert("⛔ Cannot resize event into a blocked date.");
      return;
    }

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
        doctor_email: form.doctor_email,
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

  const eventStyleGetter = (event) => {
    if (event.isBlocked) {
      return {
        style: {
          backgroundColor: '#bdbdbd',
          color: 'white',
          fontStyle: 'italic',
          pointerEvents: 'none',
          border: '1px solid #888',
          opacity: 0.8,
        }
      };
    }

    return {
      style: {
        backgroundColor: event.color || '#3174ad',
        borderRadius: '4px',
        opacity: event.isPast ? 0.6 : 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        cursor: event.isPast ? 'not-allowed' : 'pointer',
      }
    };
  };



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
          doctor_email: form.doctor_email,
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
          doctor_email: form.doctor_email,
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
          doctor_email: form.doctor_email,
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
          doctor_email: form.doctor_email,
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

  const handleManualSubmit = async () => {
    const token = localStorage.getItem("token");

    try {
      const payload = {
        ...manualForm,
        original_time: manualForm.time,
        change_type: "manual",
        is_read: false,
      };

      await axios.post(`${API_BASE_URL}/api/scheduling/add-to-timetable`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Manual session added successfully.");
      setShowManualSessionModal(false);
      setManualForm({
        session_name: "",
        name: "",
        doctor_email: "",
        date: "",
        time: "",
        location: "",
        students: "",
        change_reason: ""
      });

      if (refreshSessions) {
        await refreshSessions();
      }
    } catch (err) {
      console.error("❌ Error adding manual session:", err);
      alert("⚠️ Failed to add manual session. Check input fields.");
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
        <h3></h3>
        <div>
          <button
            style={{ backgroundColor: '#4CAF50', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
            onClick={() => setShowUploadModal(true)}
          >
            Upload Excel for Blocked Dates
          </button>
        </div>
      </div>

      <div style={{ padding: '10px 20px', textAlign: 'right' }}>
        <button
          onClick={() => setShowManualSessionModal(true)}
          style={{
            backgroundColor: '#2196F3',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ➕ Create Manual Session
        </button>
      </div>


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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflowY: 'auto', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div ref={modalRef} style={{ background: '#fff', padding: '30px 40px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 0 20px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2>Edit Event</h2>
            <label>Title:</label>
            <input className="edit-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <label>Doctor:</label>
            <Select
              options={doctorOptions}
              value={
                doctorOptions.find(option => option.value.name === form.doctor) || null
              }
              onChange={(selected) => {
                setForm({
                  ...form,
                  doctor: selected?.value.name || "",
                  doctor_email: selected?.value.email || ""
                });
              }}
              placeholder={form.doctor || "Search and select a doctor..."}
            />

            <label>Students:</label>
            <div className="student-chips-scrollable" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {form.students.map((name, index) => (
                <div key={index} className="chip" style={{
                  padding: '5px 10px', background: '#d0e6ff', borderRadius: '15px',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  {name}
                  <button
                    type="button"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      const updated = form.students.filter((_, i) => i !== index);
                      setForm({ ...form, students: updated });
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <Select
              isMulti
              placeholder="Add students..."
              options={allStudentNames.map(student => ({
                value: student.name,
                label: `${student.name} (${student.school || 'Unknown'}, Year ${student.yearofstudy || '?'})`
              }))}
              filterOption={(option, input) => {
                const words = input.toLowerCase().split(/\s+/); // Split input into words: ["nus", "m3"]
                const target = option.label.toLowerCase().replace(/year\s?/g, 'm'); // e.g. "john tan (nus, m3)"

                return words.every(word => target.includes(word));
              }}
              onChange={(selectedOptions) => {
                const selectedNames = selectedOptions.map(o => o.value);
                const combined = [...new Set([...form.students, ...selectedNames])];
                setForm({ ...form, students: combined });
              }}
            />


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

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', padding: '30px', borderRadius: '12px', width: '90%',
            maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <h3>Upload Blocked Dates</h3>

            <label>Excel File:</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />

            <label>School:</label>
            <select value={uploadSchool} onChange={e => setUploadSchool(e.target.value)}>
              <option value="">-- Select School --</option>
              <option value="DUKE NUS">Duke NUS</option>
              <option value="NUS YLL">NUS YLL</option>
              <option value="NTU LKC">NTU LKC</option>
            </select>

            <label>Year of Study:</label>
            <select value={uploadYear} onChange={e => setUploadYear(e.target.value)}>
              <option value="">-- Select Year --</option>
              <option value="M1">M1</option>
              <option value="M2">M2</option>
              <option value="M3">M3</option>
              <option value="M4">M4</option>
              <option value="M5">M5</option>
            </select>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <button
                style={{ backgroundColor: '#4CAF50', color: '#fff', padding: '8px 16px', borderRadius: '6px' }}
                disabled={!uploadFile || !uploadSchool || !uploadYear}
                onClick={handleExcelSubmit}
              >
                Upload
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#ccc' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Overlay for Manual Session Creation */}
      {showManualSessionModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="modal-box" style={{
            maxWidth: "600px",
            background: "#fff",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <h3>Create Manual Session</h3>

            {/* Session Name */}
            <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold" }}>Session Name</label>
              <input
                type="text"
                value={manualForm.session_name}
                onChange={(e) => setManualForm({ ...manualForm, session_name: e.target.value })}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>

            {/* Doctor Dropdown */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: "bold" }}>Doctor</label>
              <Select
                options={doctorOptions}
                onChange={(selected) => {
                  setManualForm({
                    ...manualForm,
                    name: selected?.value.name || "",
                    doctor_email: selected?.value.email || ""
                  });
                }}
                placeholder="Search and select a doctor..."
              />
            </div>

            {/* Date */}
            <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold" }}>Date (e.g. 7 August 2025)</label>
              <input
                type="text"
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>

            {/* Time */}
            <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold" }}>Time (e.g. 2pm–4pm)</label>
              <input
                type="text"
                value={manualForm.time}
                onChange={(e) => setManualForm({ ...manualForm, time: e.target.value })}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>

            {/* Location */}
            <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold" }}>Location</label>
              <input
                type="text"
                value={manualForm.location}
                onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>

            {/* Students */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: "bold" }}>Students</label>
              <div className="student-chips-scrollable" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '10px',
                maxHeight: '100px',
                overflowY: 'auto'
              }}>
                {(manualForm.students?.split(",") || []).filter(Boolean).map((name, index) => (
                  <div key={index} className="chip" style={{
                    padding: '6px 10px',
                    background: '#d0e6ff',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {name}
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                      onClick={() => {
                        const updated = manualForm.students
                          .split(",")
                          .filter((_, i) => i !== index)
                          .join(",");
                        setManualForm({ ...manualForm, students: updated });
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <Select
                isMulti
                placeholder="Add students..."
                options={allStudentNames
                  .filter(student => !(manualForm.students || "").split(",").includes(student.name))
                  .map(student => ({
                    value: student.name,
                    label: `${student.name} (${student.school || 'Unknown'}, ${student.yearofstudy || '?'})`
                  }))
                }
                filterOption={(option, input) => {
                  const words = input.toLowerCase().split(/\s+/);
                  const target = option.label.toLowerCase().replace(/year\s?/g, 'm');
                  return words.every(word => target.includes(word));
                }}
                onChange={(selectedOptions) => {
                  const selectedNames = selectedOptions.map(o => o.value);
                  const currentNames = (manualForm.students || "").split(",").filter(n => n);
                  const combined = [...new Set([...currentNames, ...selectedNames])];
                  setManualForm({ ...manualForm, students: combined.join(",") });
                }}
              />

            </div>

            {/* Change Reason */}
            <div style={{ marginBottom: "16px", display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold" }}>Change Reason (optional)</label>
              <input
                type="text"
                value={manualForm.change_reason}
                onChange={(e) => setManualForm({ ...manualForm, change_reason: e.target.value })}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>

            {/* Buttons */}
            <div className="modal-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={handleManualSubmit} className="confirm-btn">Submit</button>
              <button onClick={() => setShowManualSessionModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}



    </>
  );
};

export default DoctorScheduling;
