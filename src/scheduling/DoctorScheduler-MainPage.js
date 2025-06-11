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

  // Modal control state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isChangeRequest, setIsChangeRequest] = useState(false);
  const [locationInput, setLocationInput] = useState("");

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

  const openLocationModal = (notif, type) => {
    setSelectedNotif(notif);
    setIsChangeRequest(type === "change");
    setLocationInput("");
    setShowLocationModal(true);
  };

  const handleConfirmLocation = async () => {
    try {
      if (isChangeRequest) {
        await axios.post("http://localhost:3001/api/scheduling/add-to-timetable", {
          session_name: selectedNotif.session_name,
          name: selectedNotif.name,
          date: selectedNotif.new_session,
          time: "-",
          location: locationInput,
          students: selectedNotif.students || ""
        });

        await axios.delete(`http://localhost:3001/api/scheduling/parsed-email/${selectedNotif.id}`);
      } else {
        for (const slot of selectedNotif.available_dates) {
          await axios.post("http://localhost:3001/api/scheduling/add-to-timetable", {
            session_name: selectedNotif.session_name,
            name: selectedNotif.name,
            date: slot.date,
            time: slot.time || "-",
            location: locationInput,
            students: selectedNotif.students || ""
          });
        }

        await axios.delete(`http://localhost:3001/api/scheduling/parsed-email/${selectedNotif.id}`);
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
            {availabilityNotifs.map((notif, index) => (
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

                <div style={{ marginTop: "10px" }}>
                  <button className="accept-btn" onClick={() => openLocationModal(notif, "availability")}>✅ Accept</button>
                  <button className="change-btn" disabled>🔄 Change</button>
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
                  <span className="detail-label">Session:</span> {notif.session_name || "—"}<br />
                  <span className="detail-label">Original Session:</span> {notif.original_session || "—"}<br />
                  <span className="detail-label">New Session:</span> {notif.new_session || "—"}<br />
                  <span className="detail-label">Students:</span> {notif.students || "—"}<br />
                  <span className="detail-label">Reason:</span> {notif.reason || "—"}<br />
                  <button className="accept-btn" onClick={() => openLocationModal(notif, "change")}>✅ Accept</button>
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
