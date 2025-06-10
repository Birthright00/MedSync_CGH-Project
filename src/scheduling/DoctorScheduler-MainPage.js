import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import DoctorScheduling from "./DoctorScheduling";
import "../styles/DoctorScheduler.css";
import "../styles/navbar.css";

const DoctorScheduler = () => {
  const [availabilityNotifs, setAvailabilityNotifs] = useState([]);
  const [changeRequestNotifs, setChangeRequestNotifs] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [availabilityRes, changeReqRes] = await Promise.all([
          axios.get("http://localhost:3001/api/scheduling/availability-notifications"),
          axios.get("http://localhost:3001/api/scheduling/change_request"),
        ]);
        setAvailabilityNotifs(availabilityRes.data);
        setChangeRequestNotifs(changeReqRes.data);
      } catch (err) {
        console.error("❌ Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 5000); // every 5s

    return () => clearInterval(intervalId); // Cleanup
  }, []);

  return (
    <>
      <Navbar />
      <div className="doctor-scheduler-page">
        <div className="doctor-scheduler-container">
          <div className="doctor-scheduler-top">
            <div className="notification-box">
              <h2>🩺 Doctor Availability Notifications</h2>
              {availabilityNotifs.map((notif, index) => (
                <div key={index} className="response-card fade-in">
                  <div className="card-header">
                    <div className="doctor-name">{notif.doctor}</div>
                    <div className="status-badge responded">AVAILABILITY</div>
                  </div>
                  <div className="session-details">
                    <span className="detail-label">Session:</span>
                    <span className="detail-value"> {notif.session_name || "—"}</span>
                    <br />
                    <span className="detail-label">Students:</span>
                    <span className="detail-value"> {notif.students || "—"}</span>
                    <br />
                    <span className="detail-label">Doctor's Available Dates:</span>
                  </div>
                  <div className="date-slots">
                    {notif.available_dates.map((slot, i) => (
                      <div key={i} className="date-slot">
                        <div className="date-slot-content">
                          <span className="date-text">{slot.date}</span>
                          <br />
                          <span className="time-text">{slot.time || "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="notification-box">
            <h2>📤 Change Request Notifications</h2>
            {changeRequestNotifs.map((notif, index) => (
              <div key={index} className="response-card fade-in">
                <div className="card-header">
                  <div className="doctor-name">{notif.doctor}</div>
                  <div className="status-badge pending">CHANGE REQUEST</div>
                </div>
                <div className="session-details">
                  <span className="detail-label">Session:</span>
                  <span className="detail-value"> {notif.session_name || "—"}</span>
                  <br />
                  <span className="detail-label">Original Session:</span>
                  <span className="detail-value"> {notif.original_session || "—"}</span>
                  <br />
                  <span className="detail-label">New Session:</span>
                  <span className="detail-value"> {notif.new_session || "—"}</span>
                  <br />
                  <span className="detail-label">Students:</span>
                  <span className="detail-value"> {notif.students || "—"}</span>
                  <br />
                  <span className="detail-label">Reason:</span>
                  <span className="detail-value"> {notif.reason || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="timetable-box">
          <h2>📅 Timetable </h2>
          <DoctorScheduling />
        </div>
      </div>
    </>
  );
};

export default DoctorScheduler;
