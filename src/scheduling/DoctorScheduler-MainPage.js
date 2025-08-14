import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import Navbar from "../components/Navbar";
import DoctorScheduling from "./DoctorScheduling";
import cghNoNotifications from "../images/cgh_no_notifications.png";
import "../styles/DoctorScheduler.css";
import "../styles/navbar.css";
import API_BASE_URL from '../apiConfig';
import { MdCancel } from 'react-icons/md';
import { MdCheckBox, MdAutorenew } from 'react-icons/md';


const DoctorScheduler = () => {
  const [availabilityNotifs, setAvailabilityNotifs] = useState([]);
  const [changeRequestNotifs, setChangeRequestNotifs] = useState([]);
  const [timetableSessions, setTimetableSessions] = useState([]);

  // Modal control state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isChangeRequest, setIsChangeRequest] = useState(false);
  const [locationInput, setLocationInput] = useState("");

  


  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");

      const [availabilityRes, changeReqRes, timetableRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/scheduling/availability-notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/scheduling/change_request`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/scheduling/timetable`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
      setAvailabilityNotifs(availabilityRes.data);
      setChangeRequestNotifs(changeReqRes.data);
      setTimetableSessions(timetableRes.data);
    } catch (err) {
      console.error("❌ Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const intervalId = setInterval(fetchAllData, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const openLocationModal = (notif, type) => {
    setSelectedNotif(notif);
    setIsChangeRequest(type === "change");
    setLocationInput("");
    setShowLocationModal(true);
  };

  // Handle notification rejection
  // Deletes the notification and refreshes the list
  // This is used for both availability and change requests
  const handleReject = async (notifId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/scheduling/parsed-email/${notifId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAllData();  // Refresh after delete
    } catch (err) {
      console.error("❌ Failed to reject notification:", err);
    }
  };

  // Normalize start time from raw time range
  // Handles different dash variants and formats the time to "h:mma"
  // This is used to ensure consistent time formatting for matching sessions
  function normalizeStartTime(rawTimeRange) {
    if (!rawTimeRange) return "";
    const dashVariants = ['–', '-', '—'];
    let parts;

    for (const dash of dashVariants) {
      if (rawTimeRange.includes(dash)) {
        parts = rawTimeRange.split(dash);
        break;
      }
    }

    if (!parts || parts.length < 1) return "";

    const rawStart = parts[0].trim();
    
    // Try multiple moment.js parsing formats to handle various time formats
    const formats = [
      "h:mmA",      // 3:00PM
      "hA",         // 3PM  
      "h:mma",      // 3:00pm
      "ha",         // 3pm
      "HH:mm",      // 15:00 (24-hour)
      "H:mm",       // 3:00 (24-hour single digit)
    ];
    
    const parsed = moment(rawStart, formats, true); // strict parsing
    
    if (parsed.isValid()) {
      return parsed.format("h:mma").toLowerCase();
    }
    
    // Fallback: return the original time in lowercase
    return rawStart.toLowerCase();
  }


  // Handle location confirmation for both availability and change requests
  // For availability, it adds the session to the timetable
  // For change requests, it updates the existing session
  const handleConfirmLocation = async () => {
    try {
      const token = localStorage.getItem("token");
      if (isChangeRequest) {
        const newSession = selectedNotif.new_session || "";
        const [datePart, ...timeParts] = newSession.split(/(?<=\d{4})\s+/);
        const date = datePart?.trim() || "";
        const time = timeParts.join(" ").trim() || "";

        // Parse original session to match
        const [originalDatePart, originalTimeRangeRaw] = selectedNotif.original_session.split(/(?<=\d{4})\s+/);
        const originalDate = moment(originalDatePart?.trim(), "D MMMM YYYY").format("D MMMM YYYY"); // match session.date format
        const originalTimeRange = originalTimeRangeRaw?.replace(/[()]/g, ""); // ✅ Remove brackets

        const originalStartTime = originalTimeRange?.split("-")[0]?.trim().toLowerCase();


        const matchingSession = timetableSessions.find(session => {
          // First try to match by original_session_id if available (most reliable)
          if (selectedNotif.original_session_id && session.id) {
            const sessionDateTime = moment(`${session.date} ${session.time?.split('-')[0]?.trim()}`, ["D MMMM YYYY h:mmA", "D MMMM YYYY hA"]);
            const now = moment();
            
            // Skip if session already ended
            if (sessionDateTime.isBefore(now)) return false;
            
            return selectedNotif.original_session_id == session.id; // Use == for type coercion
          }
          
          // Fallback to complex matching logic
          const sessionName = session.session_name?.trim().toLowerCase();
          const doctorName = session.name?.trim().toLowerCase();
          const expectedSessionName = (selectedNotif.original_session_name || selectedNotif.session_name)?.trim().toLowerCase();
          const expectedDoctor = selectedNotif.name?.trim().toLowerCase();

          const sessionDate = moment(session.date?.trim(), ["D MMMM YYYY", "DD MMMM YYYY"]).format("D MMMM YYYY");
          const expectedDate = moment(originalDatePart?.trim(), ["D MMMM YYYY", "DD MMMM YYYY"]).format("D MMMM YYYY");

          const sessionStartTime = normalizeStartTime(session.time?.replace(/[()]/g, ""));
          const expectedStartTime = normalizeStartTime(originalTimeRange?.split(/[-–—]/)[0]);  // ✅ Normalize like session

          const sessionDateTime = moment(`${sessionDate} ${sessionStartTime}`, ["D MMMM YYYY h:mma"]);
          const now = moment();

          // ❌ Skip if session already ended
          if (sessionDateTime.isBefore(now)) return false;

          console.log("🔍 Matching against:");
          console.log("sessionName:", sessionName);
          console.log("expectedName:", expectedSessionName);
          console.log("doctorName:", doctorName);
          console.log("expectedDoctor:", expectedDoctor);
          console.log("sessionDate:", sessionDate);
          console.log("expectedDate:", originalDate);
          console.log("sessionStartTime:", sessionStartTime);
          console.log("expectedTime:", originalStartTime);

          return (
            sessionName === expectedSessionName &&
            doctorName === expectedDoctor &&
            sessionDate === originalDate &&
            sessionStartTime === originalStartTime
          );
        });



        if (!matchingSession) {
          alert("⚠️ Could not find the original session to update.");
          return;
        }

        const timePartsSplit = time.split(/[-–]/); // handles both hyphen and en-dash

        if (timePartsSplit.length < 2) {
          alert("⚠️ Invalid time format. Please make sure it follows the format like '1pm–2pm'.");
          return;
        }

        const newStart = moment(`${date} ${timePartsSplit[0].trim()}`, "D MMMM YYYY h:mmA").toISOString();
        const newEnd = moment(`${date} ${timePartsSplit[1].trim()}`, "D MMMM YYYY h:mmA").toISOString()

        await axios.patch(`${API_BASE_URL}/api/scheduling/update-scheduled-session/${matchingSession.id}`, {
          title: selectedNotif.session_name,
          doctor: selectedNotif.name,
          doctor_email: selectedNotif.from_email, // ✅ Add missing doctor_email field
          location: locationInput,
          start: newStart,
          end: newEnd,
          original_time: selectedNotif.original_session,
          change_type: "rescheduled",
          change_reason: selectedNotif.reason,
          is_read: 0
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        await axios.delete(`${API_BASE_URL}/api/scheduling/parsed-email/${selectedNotif.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      else {
        for (const slot of selectedNotif.available_dates) {
          await axios.post(`${API_BASE_URL}/api/scheduling/add-to-timetable`, {
            session_name: selectedNotif.session_name,
            name: selectedNotif.name,
            date: slot.date,
            time: slot.time || "-",
            location: locationInput,
            students: selectedNotif.students || "",
            doctor_email: selectedNotif.from_email
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }

        await axios.delete(`${API_BASE_URL}/api/scheduling/parsed-email/${selectedNotif.id}`,
          { headers: { Authorization: `Bearer ${token}` } });
      }

      setShowLocationModal(false);
      await fetchAllData();
    } catch (err) {
      console.error("❌ Failed to accept:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="doctor-scheduler-page">
        <div className="doctor-scheduler-container">

          {/* Availability Notifications */}
          <div className="notification-box">
            <h2>🩺 Doctor Availability Notifications</h2>

            {availabilityNotifs.length === 0 ? (
              <div className="no-notifications fade-in">
                <img src={cghNoNotifications} alt="No Notifications" className="no-notifications-image" />
                <p className="no-notifications-text">No New Notifications!</p>
              </div>
            ) : (
              availabilityNotifs.map((notif, index) => (
                <div key={index} className="response-card fade-in">
                  <div className="card-header">
                    <div className="doctor-name">{notif.name}</div>
                    <div className="status-badge responded">AVAILABILITY</div>
                  </div>
                  <div className="session-details">
                    <span className="detail-label">Session:</span> {notif.session_name || "—"}<br />
                    <span className="detail-label">Students:</span> {notif.students || "—"}<br />
                    <span className="detail-label">Available Dates:</span>
                  </div>

                  <div className="date-slots">
                    {notif.available_dates.map((slot, i) => (
                      <div key={i} className="date-slot">
                        <div className="date-slot-content">
                          <span className="date-text">{slot.date}</span><br />
                          <span className="time-text">{slot.time || "—"}</span><br />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <button className="accept-btn" onClick={() => openLocationModal(notif, "availability")}>
                      <MdCheckBox style={{ fontSize: '22px', verticalAlign: 'middle', position: 'relative', top: '-1px', marginRight: '5px' }} />
                      Accept
                    </button>

                    <button className="change-btn" disabled>
                      <MdAutorenew style={{ fontSize: '22px', verticalAlign: 'middle', position: 'relative', top: '-1px', marginRight: '5px' }} />
                      Change
                    </button>

                    <button className="reject-btn" onClick={() => handleReject(notif.id)}>
                      <MdCancel style={{ fontSize: '22px', verticalAlign: 'middle', position: 'relative', top: '-1px', marginRight: '5px' }} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>


          {/* Change Request Notifications */}
          <div className="notification-box">
            <h2>📤 Change Request Notifications</h2>

            {changeRequestNotifs.length === 0 ? (
              <div className="no-notifications fade-in">
                <img src={cghNoNotifications} alt="No Notifications" className="no-notifications-image" />
                <p className="no-notifications-text">No New Notifications!</p>
              </div>
            ) : (
              changeRequestNotifs.map((notif, index) => (
                <div key={index} className="response-card fade-in">
                  <div className="card-header">
                    <div className="doctor-name">{notif.name}</div>
                    <div className="status-badge pending">CHANGE REQUEST</div>
                  </div>
                  <div className="session-details">
                    <span className="detail-label">Session:</span> {notif.session_name || "—"}<br />
                    <span className="detail-label">Original Session:</span> {notif.original_session || "—"}<br />
                    <span className="detail-label">New Session:</span> {notif.new_session || "—"}<br />
                    <span className="detail-label">Students:</span> {notif.students || "—"}<br />
                    <span className="detail-label">Reason:</span> {notif.reason || "—"}<br />

                    <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                      <button className="accept-btn" onClick={() => openLocationModal(notif, "change")}>
                        <MdCheckBox style={{ fontSize: '22px', verticalAlign: 'middle', position: 'relative', top: '-1px', marginRight: '5px' }} />
                        Accept
                      </button>

                      <button className="change-btn" disabled>
                        <MdAutorenew style={{ fontSize: '22px', verticalAlign: 'middle', position: 'relative', top: '-1px', marginRight: '5px' }} />
                        Change
                      </button>

                      <button className="reject-btn" onClick={() => handleReject(notif.id)}>
                        <MdCancel style={{ fontSize: '22px', verticalAlign: 'middle', position: 'relative', top: '-1px', marginRight: '5px' }} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="timetable-box">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
            <img
              src={require('../images/medsync-cgh.png')}
              alt="MedSync"
              style={{ height: '60px', objectFit: 'contain' }}
            />
          </div>

          <DoctorScheduling sessions={timetableSessions} refreshSessions={fetchAllData} />
        </div>
      </div>

      {/* Nice Popup Modal */}
      {showLocationModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Enter Location</h3>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter location..."
              style={{ width: "100%", padding: "8px" }}
            />
            <div className="modal-buttons">
              <button onClick={handleConfirmLocation} className="confirm-btn">Confirm</button>
              <button onClick={() => setShowLocationModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorScheduler;
