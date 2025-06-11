import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import DoctorScheduling from "./DoctorScheduling";
import "../styles/DoctorScheduler.css";
import "../styles/navbar.css";

const DoctorScheduler = () => {
  const [availabilityNotifs, setAvailabilityNotifs] = useState([]);
  const [changeRequestNotifs, setChangeRequestNotifs] = useState([]);
  const [timetableSessions, setTimetableSessions] = useState([]);

  // ✅ MAIN FETCH FUNCTION (Reusable)
  const fetchAllData = async () => {
    try {
      const [availabilityRes, changeReqRes, timetableRes] = await Promise.all([
        axios.get("http://localhost:3001/api/scheduling/availability-notifications"),
        axios.get("http://localhost:3001/api/scheduling/change_request"),
        axios.get("http://localhost:3001/api/scheduling/timetable"),
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

  // ✅ Accept Availability
  const handleAcceptAvailability = async (notif, slot) => {
    const location = prompt("Enter location:");
    if (!location) return;

    try {
      await axios.post("http://localhost:3001/api/scheduling/add-to-timetable", {
        session_name: notif.session_name,
        name: notif.name,
        date: slot.date,
        time: slot.time || "-",
        location: location,
        students: notif.students || ""
      });

      // ✅ Delete from parsed_emails after successful add
      await axios.delete(`http://localhost:3001/api/scheduling/parsed-email/${notif.id}`);


      // ✅ Refresh everything after both actions complete
      await fetchAllData();
    } catch (err) {
      console.error("❌ Failed to accept availability:", err);
    }
  };

  // ✅ Accept Change Request
  const handleAcceptChangeRequest = async (notif) => {
    const location = prompt("Enter location:");
    if (!location) return;

    try {
      await axios.post("http://localhost:3001/api/scheduling/add-to-timetable", {
        session_name: notif.session_name,
        name: notif.name,
        date: notif.new_session,
        time: "-",  
        location: location,
        students: notif.students || ""
      });

      // ✅ Delete from parsed_emails after successful add
      await axios.delete(`http://localhost:3001/api/scheduling/parsed-email/${notif.id}`);

      // ✅ Refresh everything after both actions complete
      await fetchAllData();
    } catch (err) {
      console.error("❌ Failed to accept change request:", err);
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
            {availabilityNotifs.map((notif, index) => (
              <div key={index} className="response-card fade-in">
                <div className="card-header">
                  <div className="doctor-name">{notif.name}</div>
                  <div className="status-badge responded">AVAILABILITY</div>
                </div>
                <div className="session-details">
                  <span className="detail-label">Session:</span>
                  <span className="detail-value"> {notif.session_name || "—"}</span><br />
                  <span className="detail-label">Students:</span>
                  <span className="detail-value"> {notif.students || "—"}</span><br />
                  <span className="detail-label">Available Dates:</span>
                </div>
                <div className="date-slots">
                  {notif.available_dates.map((slot, i) => (
                    <div key={i} className="date-slot">
                      <div className="date-slot-content">
                        <span className="date-text">{slot.date}</span><br />
                        <span className="time-text">{slot.time || "—"}</span><br />
                        <button className="accept-btn" onClick={() => handleAcceptAvailability(notif, slot)}>✅ Accept</button>
                        <button className="change-btn" disabled>🔄 Change</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Change Request Notifications */}
          <div className="notification-box">
            <h2>📤 Change Request Notifications</h2>
            {changeRequestNotifs.map((notif, index) => (
              <div key={index} className="response-card fade-in">
                <div className="card-header">
                  <div className="doctor-name">{notif.name}</div>
                  <div className="status-badge pending">CHANGE REQUEST</div>
                </div>
                <div className="session-details">
                  <span className="detail-label">Session:</span>
                  <span className="detail-value"> {notif.session_name || "—"}</span><br />
                  <span className="detail-label">Original Session:</span>
                  <span className="detail-value"> {notif.original_session || "—"}</span><br />
                  <span className="detail-label">New Session:</span>
                  <span className="detail-value"> {notif.new_session || "—"}</span><br />
                  <span className="detail-label">Students:</span>
                  <span className="detail-value"> {notif.students || "—"}</span><br />
                  <span className="detail-label">Reason:</span>
                  <span className="detail-value"> {notif.reason || "—"}</span><br />
                  <button className="accept-btn" onClick={() => handleAcceptChangeRequest(notif)}>✅ Accept</button>
                  <button className="change-btn" disabled>🔄 Change</button>
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="timetable-box">
          <h2>📅 Timetable</h2>
          <DoctorScheduling sessions={timetableSessions} />
        </div>
      </div>
    </>
  );
};

export default DoctorScheduler;
