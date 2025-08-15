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
  const [showSlotSelectionModal, setShowSlotSelectionModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isChangeRequest, setIsChangeRequest] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]); // For multi-session selection

  


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
    setSelectedSlot(null);
    setSelectedSlots([]);
    
    if (type === "availability") {
      const sessionCount = parseInt(notif.session_count) || 1;
      const availableSlots = notif.available_dates || [];
      
      console.log("🔍 [DEBUG] Session count:", sessionCount, "Available slots:", availableSlots.length);
      
      // If we need multiple sessions OR have multiple slots to choose from, show selection modal
      if (sessionCount > 1 || (sessionCount === 1 && availableSlots.length > 1)) {
        setShowSlotSelectionModal(true);
      } else {
        // Single session with single slot - go directly to location
        if (availableSlots.length === 1) {
          setSelectedSlot(availableSlots[0]);
        }
        setShowLocationModal(true);
      }
    } else {
      // For change requests, go directly to location
      setShowLocationModal(true);
    }
  };

  const handleSlotSelection = (slot) => {
    const sessionCount = parseInt(selectedNotif?.session_count) || 1;
    
    if (sessionCount === 1) {
      // Single session - select one slot
      setSelectedSlot(slot);
      setSelectedSlots([slot]);
      setShowSlotSelectionModal(false);
      setShowLocationModal(true);
    } else {
      // Multiple sessions - toggle slot selection
      setSelectedSlots(prev => {
        const isSelected = prev.some(s => s.date === slot.date && s.time === slot.time);
        if (isSelected) {
          return prev.filter(s => !(s.date === slot.date && s.time === slot.time));
        } else if (prev.length < sessionCount) {
          return [...prev, slot];
        } else {
          alert(`You can only select ${sessionCount} time slots for this session.`);
          return prev;
        }
      });
    }
  };

  const handleConfirmSlotSelection = () => {
    const sessionCount = parseInt(selectedNotif?.session_count) || 1;
    
    if (selectedSlots.length !== sessionCount) {
      alert(`Please select exactly ${sessionCount} time slot${sessionCount > 1 ? 's' : ''}.`);
      return;
    }
    
    setShowSlotSelectionModal(false);
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

        // 📧 Send change request acceptance notification
        try {
          console.log("🔍 [FRONTEND DEBUG] Sending change request notification:", {
            notification_id: selectedNotif.id,
            doctor_email: selectedNotif.from_email,
            session_name: selectedNotif.session_name,
            original_date: originalDatePart?.trim(),
            new_date: date,
            new_time: time
          });

          const notificationResponse = await axios.post(`${API_BASE_URL}/api/scheduling/notify-change-request-accepted`, {
            parsed_email_id: selectedNotif.id,
            doctor_email: selectedNotif.from_email,
            session_details: {
              session_name: selectedNotif.session_name,
              original_date: originalDatePart?.trim(),
              original_time: originalTimeRange,
              date: date,
              time: time,
              students: selectedNotif.students || "",
              change_reason: selectedNotif.reason
            },
            new_schedule: {
              date: date,
              time: time,
              location: locationInput
            }
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("✅ [FRONTEND DEBUG] Change request notification response:", notificationResponse.data);
          
          if (notificationResponse.data.email_sent) {
            console.log("✅ Email sent successfully!");
          } else {
            console.warn("⚠️ Email prepared but not sent (check server logs for access token issues)");
          }
        } catch (notifErr) {
          console.error("❌ [FRONTEND DEBUG] Failed to send change request notification:", {
            error: notifErr.message,
            response: notifErr.response?.data,
            status: notifErr.response?.status
          });
        }

        await axios.delete(`${API_BASE_URL}/api/scheduling/parsed-email/${selectedNotif.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      else {
        // For availability requests, add the selected slot(s)
        const slotsToAdd = selectedSlots.length > 0 ? selectedSlots : 
                          selectedSlot ? [selectedSlot] : 
                          selectedNotif.available_dates?.slice(0, 1) || [];
        
        if (slotsToAdd.length === 0) {
          alert("⚠️ No slots selected. Please try again.");
          return;
        }

        const sessionCount = parseInt(selectedNotif.session_count) || 1;
        
        if (slotsToAdd.length !== sessionCount) {
          alert(`⚠️ Expected ${sessionCount} slot(s) but got ${slotsToAdd.length}. Please try again.`);
          return;
        }

        console.log("🔍 [FRONTEND DEBUG] Adding selected slots to timetable:", slotsToAdd);

        // Add each selected slot as a separate session
        let conflictOccurred = false;
        let conflictDetails = null;
        
        for (let i = 0; i < slotsToAdd.length; i++) {
          const slot = slotsToAdd[i];
          try {
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
            console.log(`✅ [FRONTEND DEBUG] Session ${i + 1} added successfully:`, slot);
          } catch (addErr) {
            if (addErr.response?.status === 409 && addErr.response?.data?.error === "SCHEDULING_CONFLICT") {
              console.error("❌ [FRONTEND DEBUG] Scheduling conflict detected:", addErr.response.data);
              conflictOccurred = true;
              conflictDetails = addErr.response.data;
              break; // Stop adding more sessions if conflict occurs
            } else {
              console.error("❌ [FRONTEND DEBUG] Error adding session:", addErr);
              throw addErr; // Re-throw non-conflict errors
            }
          }
        }
        
        if (conflictOccurred) {
          alert(`⚠️ SCHEDULING CONFLICT DETECTED!\n\nDr. ${selectedNotif.name} already has a session scheduled:\n\n` +
                `Existing: "${conflictDetails.conflict.existing_session}"\n` +
                `Time: ${conflictDetails.conflict.existing_time}\n` +
                `Location: ${conflictDetails.conflict.existing_location}\n\n` +
                `This conflicts with the new session at ${conflictDetails.conflict.conflicting_time}\n\n` +
                `Please choose a different time slot or reschedule the existing session.`);
          
          setShowLocationModal(false);
          await fetchAllData(); // Refresh to show current state
          return; // Exit without sending notification or deleting parsed email
        }

        // 📧 Send availability acceptance notification
        try {
          const acceptedSlotTexts = slotsToAdd.map(slot => 
            `${slot.date} at ${slot.time || 'TBD'}`
          );
          const acceptedSlotText = acceptedSlotTexts.join(', ');

          console.log("🔍 [FRONTEND DEBUG] Sending availability notification:", {
            notification_id: selectedNotif.id,
            doctor_email: selectedNotif.from_email,
            session_name: selectedNotif.session_name,
            accepted_slots: acceptedSlotTexts,
            location: locationInput
          });

          const notificationResponse = await axios.post(`${API_BASE_URL}/api/scheduling/notify-availability-accepted`, {
            parsed_email_id: selectedNotif.id,
            doctor_email: selectedNotif.from_email,
            session_details: {
              session_name: selectedNotif.session_name,
              date: slotsToAdd.length === 1 ? slotsToAdd[0].date : 'Multiple dates',
              time: slotsToAdd.length === 1 ? slotsToAdd[0].time : 'Multiple times',
              location: locationInput,
              students: selectedNotif.students || ""
            },
            accepted_slot: acceptedSlotText
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("✅ [FRONTEND DEBUG] Availability notification response:", notificationResponse.data);
          
          if (notificationResponse.data.email_sent) {
            console.log("✅ Email sent successfully!");
          } else {
            console.warn("⚠️ Email prepared but not sent (check server logs for access token issues)");
          }
        } catch (notifErr) {
          console.error("❌ [FRONTEND DEBUG] Failed to send availability notification:", {
            error: notifErr.message,
            response: notifErr.response?.data,
            status: notifErr.response?.status
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
                    <span className="detail-label">Sessions Needed:</span> <strong>{notif.session_count || 1}x</strong><br />
                    <span className="detail-label">Students:</span> {notif.students || "—"}<br />
                    <span className="detail-label">Doctor:</span> {notif.name} ({notif.from_email})<br />
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

      {/* Slot Selection Modal */}
      {showSlotSelectionModal && selectedNotif && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Select Time Slots</h3>
            {(() => {
              const sessionCount = parseInt(selectedNotif.session_count) || 1;
              return (
                <p>
                  Choose <strong>{sessionCount}</strong> time slot{sessionCount > 1 ? 's' : ''} for <strong>{selectedNotif.session_name}</strong>:
                  {sessionCount > 1 && (
                    <span style={{ color: "#666", fontSize: "0.9em" }}>
                      <br />({selectedSlots.length}/{sessionCount} selected)
                    </span>
                  )}
                </p>
              );
            })()}
            <div style={{ marginTop: "15px" }}>
              {selectedNotif.available_dates?.map((slot, index) => {
                const isSelected = selectedSlots.some(s => s.date === slot.date && s.time === slot.time);
                const sessionCount = parseInt(selectedNotif.session_count) || 1;
                
                return (
                  <div 
                    key={index} 
                    style={{
                      padding: "10px",
                      margin: "5px 0",
                      border: `2px solid ${isSelected ? "#2196F3" : "#ddd"}`,
                      borderRadius: "5px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#e3f2fd" : "#f9f9f9",
                      transition: "all 0.2s"
                    }}
                    onClick={() => handleSlotSelection(slot)}
                  >
                    <strong>{slot.date}</strong>
                    {isSelected && <span style={{ color: "#2196F3", marginLeft: "10px" }}>✓</span>}
                    <br />
                    <span style={{ color: "#666" }}>{slot.time || "Time TBD"}</span>
                  </div>
                );
              })}
            </div>
            <div className="modal-buttons" style={{ marginTop: "20px" }}>
              {(() => {
                const sessionCount = parseInt(selectedNotif.session_count) || 1;
                return sessionCount > 1 ? (
                  <button 
                    onClick={handleConfirmSlotSelection}
                    className="confirm-btn"
                    disabled={selectedSlots.length !== sessionCount}
                  >
                    Confirm Selection ({selectedSlots.length}/{sessionCount})
                  </button>
                ) : null;
              })()}
              <button onClick={() => setShowSlotSelectionModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Location Input Modal */}
      {showLocationModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Enter Location</h3>
            {(() => {
              const slotsToShow = selectedSlots.length > 0 ? selectedSlots : 
                                selectedSlot ? [selectedSlot] : [];
              
              return slotsToShow.length > 0 && (
                <div style={{ marginBottom: "10px", color: "#666" }}>
                  <p>Selected slot{slotsToShow.length > 1 ? 's' : ''}:</p>
                  {slotsToShow.map((slot, index) => (
                    <p key={index} style={{ margin: "2px 0", fontWeight: "bold" }}>
                      • {slot.date} at {slot.time || 'TBD'}
                    </p>
                  ))}
                </div>
              );
            })()}
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
