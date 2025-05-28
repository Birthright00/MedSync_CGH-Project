import React, { useState } from "react";
import Navbar from "./Navbar";
import "../styles/scheduler.css";

function DoctorScheduler() {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateSelection = (dateIndex) => {
    setSelectedDate(dateIndex);
  };

  const handleSendReminder = () => {
    // Handle send reminder logic
    console.log("Sending reminder...");
  };

  const handleCancelRequest = () => {
    // Handle cancel request logic
    console.log("Cancelling request...");
  };

  const handleConfirmSession = () => {
    // Handle confirm session logic
    console.log("Confirming selected session...");
  };

  const handleApproveChange = () => {
    // Handle approve change logic
    console.log("Approving change and notifying students...");
  };

  const handleRequestAlternative = () => {
    // Handle request alternative logic
    console.log("Requesting alternative...");
  };

  return (
    <div>
      <Navbar />
      <div className="scheduler-container">
        <div className="scheduler-header">
          <span className="scheduler-icon">📋</span>
          <span className="scheduler-title">
            Doctor Responses & Session Management
          </span>
        </div>

        {/* Awaiting Response Card */}
        <div className="response-card">
          <div className="card-header">
            <div className="doctor-name">Dr. Sarah Lim - Cardiology</div>
            <div className="status-badge awaiting">AWAITING RESPONSE</div>
          </div>
          <div className="session-details">
            <span className="detail-label">Session:</span>
            <span className="detail-value"> Clinical Teaching Round |</span>
            <span className="detail-label"> Students:</span>
            <span className="detail-value"> 3 students</span>
            <br />
            <span className="detail-label">Requested:</span>
            <span className="detail-value"> March 15-25, 2025 |</span>
            <span className="detail-label"> Duration:</span>
            <span className="detail-value"> 2 hours</span>
            <br />
            <span className="detail-label">Sent:</span>
            <span className="detail-value"> 2 days ago</span>
          </div>
          <div className="action-buttons">
            <button className="secondary-button" onClick={handleSendReminder}>
              📧 Send Reminder
            </button>
            <button className="secondary-button" onClick={handleCancelRequest}>
              ❌ Cancel Request
            </button>
          </div>
        </div>

        {/* Responded Card */}
        <div className="response-card">
          <div className="card-header">
            <div className="doctor-name">
              Dr. Michael Tan - Emergency Medicine
            </div>
            <div className="status-badge responded">RESPONDED</div>
          </div>
          <div className="session-details">
            <span className="detail-label">Session:</span>
            <span className="detail-value"> Procedure Demonstration |</span>
            <span className="detail-label"> Students:</span>
            <span className="detail-value"> Year 3 Emergency (6 students)</span>
            <br />
            <span className="detail-label">Doctor's Available Dates:</span>
          </div>
          <div className="date-slots">
            <div
              className={`date-slot ${selectedDate === 0 ? "selected" : ""}`}
              onClick={() => handleDateSelection(0)}
            >
              <div className="date-slot-content">
                <span className="date-text">March 18, 2025</span>
                <br />
                <span className="time-text">2:00 PM - 4:00 PM</span>
              </div>
            </div>
            <div
              className={`date-slot ${selectedDate === 1 ? "selected" : ""}`}
              onClick={() => handleDateSelection(1)}
            >
              <div className="date-slot-content">
                <span className="date-text">March 20, 2025</span>
                <br />
                <span className="time-text">10:00 AM - 12:00 PM</span>
              </div>
            </div>
            <div
              className={`date-slot ${selectedDate === 2 ? "selected" : ""}`}
              onClick={() => handleDateSelection(2)}
            >
              <div className="date-slot-content">
                <span className="date-text">March 22, 2025</span>
                <br />
                <span className="time-text">3:00 PM - 5:00 PM</span>
              </div>
            </div>
            <div
              className={`date-slot ${selectedDate === 3 ? "selected" : ""}`}
              onClick={() => handleDateSelection(3)}
            >
              <div className="date-slot-content">
                <span className="date-text">March 25, 2025</span>
                <br />
                <span className="time-text">9:00 AM - 11:00 AM</span>
              </div>
            </div>
            <div
              className={`date-slot ${selectedDate === 4 ? "selected" : ""}`}
              onClick={() => handleDateSelection(4)}
            >
              <div className="date-slot-content">
                <span className="date-text">March 27, 2025</span>
                <br />
                <span className="time-text">1:00 PM - 3:00 PM</span>
              </div>
            </div>
          </div>
          <div className="action-buttons">
            <button className="primary-button" onClick={handleConfirmSession}>
              ✅ Confirm Selected Session
            </button>
          </div>
        </div>

        {/* Confirmed with Change Request Card */}
        <div className="response-card">
          <div className="card-header">
            <div className="doctor-name">Dr. Jennifer Wong - Pediatrics</div>
            <div className="status-badge confirmed">CONFIRMED</div>
            <div className="urgent-badge">URGENT CHANGE</div>
          </div>
          <div className="session-details">
            <span className="detail-label">Original Session: </span>
            <span className="detail-value">
              March 15, 2025 at 2:00 PM - 4:00 PM
            </span>
            <br />
            <span className="detail-label">Change Request: </span>
            <span className="detail-value">
              Doctor requested to move to March 16, 2025 at 10:00 AM - 12:00 PM
            </span>
            <br />
            <span className="detail-label">Reason: </span>
            <span className="detail-value">Emergency surgery scheduled</span>
            <br />
            <span className="detail-label">Students: </span>
            <span className="detail-value">
              Year 2 Pediatrics (10 students)
            </span>
          </div>
          <div className="notification-box">
            <div className="notification-text">
              10 students will be automatically notified of change
            </div>
            <div className="pending-text">⚠️ Pending approval</div>
          </div>
          <div className="action-buttons">
            <button className="primary-button" onClick={handleApproveChange}>
              ✅ Approve Change & Notify Students
            </button>
          </div>
          <div className="action-buttons">
            <button
              className="secondary-button"
              onClick={handleRequestAlternative}
            >
              📅 Request Alternative
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DoctorScheduler;
