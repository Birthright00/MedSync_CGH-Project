// src/pages/DoctorSessionBooking.js
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../../styles/DoctorSessionBooking.css'; // Adjust path as needed
import axios from 'axios';
import API_BASE_URL from '../../apiConfig';
import cghLogo from '../../images/cgh_logo.png';

const DoctorSessionBooking = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [doctorMCR, setDoctorMCR] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (sessionId) {
      axios.get(`${API_BASE_URL}/api/email-sessions/${sessionId}`)
        .then(res => {
          console.log("🎯 Full session data from backend:", res.data); // 🔍 DEBUG
          const slots = res.data.slots || []; // ⬅️ 'slots' is parsed from JSON backend
          setSessionData({ ...res.data, slots });
        })
        .catch(err => {
          console.error(err);

          if (err.response?.status === 403) {
            setError("🛑 You have submitted already.");
          } else if (err.response?.status === 404) {
            setError("❌ This session link is invalid or has expired.");
          } else {
            setError("Failed to fetch session details.");
          }
        });
    }
  }, [sessionId]);

  const toggleSlot = (slot) => {
    setSelectedSlots(prev => {
      const existsIndex = prev.findIndex(s =>
        s.date === slot.date &&
        (s.startTime || s.start) === (slot.startTime || slot.start) &&
        (s.endTime || s.end) === (slot.endTime || slot.end)
      );

      if (existsIndex !== -1) {
        const updated = [...prev];
        updated.splice(existsIndex, 1);
        return updated;
      } else {
        return [
          ...prev,
          {
            ...slot,
            preferredStart: '',
            preferredEnd: ''
          }
        ];
      }
    });
  };

  const handleTimeChange = (slot, field, value) => {
    setSelectedSlots(prev => {
      return prev.map(s => {
        if (
          s.date === slot.date &&
          (s.startTime || s.start) === (slot.startTime || slot.start) &&
          (s.endTime || s.end) === (slot.endTime || slot.end)
        ) {
          const updated = { ...s, [field]: value };

          // Auto-reset invalid end time
          if (
            field === 'preferredStart' &&
            updated.preferredEnd &&
            updated.preferredEnd < value
          ) {
            updated.preferredEnd = '';
          }

          return updated;
        }
        return s;
      });
    });
  };



  const handleSubmit = async () => {
    if (!doctorMCR || selectedSlots.length === 0) {
      setError("Please enter your MCR/SNB number and select at least one slot.");
      return;
    }

    for (const slot of selectedSlots) {
      if (
        slot.preferredStart &&
        slot.preferredEnd &&
        slot.preferredEnd < slot.preferredStart
      ) {
        setError(`End time cannot be earlier than start time for ${slot.date}`);
        return;
      }
    }

    try {
      // Format the slots before sending
      const cleanedSlots = selectedSlots.map(slot => ({
        date: slot.date,
        start: slot.preferredStart || slot.startTime || slot.start,
        end: slot.preferredEnd || slot.endTime || slot.end,
      }));

      await axios.patch(`${API_BASE_URL}/api/scheduling/parsed-email/${sessionId}/update-availability`, {
        selected_slots: cleanedSlots,
        mcr_number: doctorMCR.trim(),
        students: sessionData.studentDetails
          ?.map(s => `${s.name} (${s.school})`)
          .join(', ') || ''

      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Failed to submit your availability.");
    }
  };



  if (submitted) {
    return <div style={{ padding: '2rem' }}><h2>✅ Availability submitted. Thank you!</h2></div>;
  }

  const formatSlot = (slot) => {
    const date = new Date(slot.date);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-GB', options);

    const formatTime = (time) => {
      if (!time) return 'TBD';
      const [hour, minute] = time.split(':');
      const h = parseInt(hour, 10);
      const ampm = h >= 12 ? 'pm' : 'am';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minute}${ampm}`;
    };

    return `${formattedDate} (${formatTime(slot.startTime || slot.start)} – ${formatTime(slot.endTime || slot.end)})`;
  };


  if (error) {
    return (
      <div className="doctor-booking-page">
        <div className="doctor-booking-container">
          <img src={cghLogo} alt="CGH Logo" className="cgh-logo" />
          <h1>Doctor Session Availability</h1>
          <p className="error" style={{ fontSize: "1.2rem", color: "red" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-booking-page">
      <div className="doctor-booking-container">
        <img src={cghLogo} alt="CGH Logo" className="cgh-logo" />

        <h1>Doctor Session Availability</h1>
        {!sessionData && <p>Loading session details...</p>}

        {sessionData && (
          <>
            <p><strong>Session:</strong> {sessionData.session_name}</p>
            {sessionData.studentDetails?.length > 0 && (
              <div className="student-list" style={{ marginBottom: '1rem' }}>
                <p><strong>🧑‍🎓 Students in this session:</strong></p>
                <ul>
                  {sessionData.studentDetails.map((s, i) => (
                    <li key={i}>
                      {s.name} ({s.school}, {s.yearofstudy})
                    </li>
                  ))}
                </ul>
              </div>
            )}


            <div style={{ margin: '1rem 0' }}>
              <label htmlFor="mcr" style={{ display: 'block', fontWeight: 'bold' }}>
                Your MCR/SNB Number:
              </label>
              <input
                id="mcr"
                type="text"
                value={doctorMCR}
                onChange={(e) => setDoctorMCR(e.target.value)}
              />
            </div>

            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Select your preferred slots:</h3>
            <ul className="slot-list">
              {sessionData.slots.map((slot, i) => {
                const isSelected = selectedSlots.find(s =>
                  s.date === slot.date &&
                  (s.startTime || s.start) === (slot.startTime || slot.start) &&
                  (s.endTime || s.end) === (slot.endTime || slot.end)
                );

                return (
                  <li key={i} className={`slot-item ${isSelected ? 'selected' : ''}`}>
                    {/* Clickable label only */}
                    <div className="slot-label" onClick={() => toggleSlot(slot)}>
                      {formatSlot(slot)}
                      <span className="hover-message">Click to select</span>
                    </div>


                    {/* Time input fields only show if selected */}
                    {isSelected && (
                      <div className="time-inputs">
                        <label>
                          Start:
                          <input
                            type="time"
                            min={slot.startTime || slot.start}
                            max={slot.endTime || slot.end}
                            value={selectedSlots.find((s) =>
                              s.date === slot.date &&
                              (s.startTime || s.start) === (slot.startTime || slot.start) &&
                              (s.endTime || s.end) === (slot.endTime || slot.end)
                            )?.preferredStart || ''}
                            onChange={(e) => handleTimeChange(slot, 'preferredStart', e.target.value)}
                          />

                        </label>
                        <label>
                          End:
                          <input
                            type="time"
                            min={
                              selectedSlots.find((s) =>
                                s.date === slot.date &&
                                (s.startTime || s.start) === (slot.startTime || slot.start) &&
                                (s.endTime || s.end) === (slot.endTime || slot.end)
                              )?.preferredStart || (slot.startTime || slot.start)
                            }
                            max={slot.endTime || slot.end}
                            value={selectedSlots.find((s) =>
                              s.date === slot.date &&
                              (s.startTime || s.start) === (slot.startTime || slot.start) &&
                              (s.endTime || s.end) === (slot.endTime || slot.end)
                            )?.preferredEnd || ''}
                            onChange={(e) => handleTimeChange(slot, 'preferredEnd', e.target.value)}
                          />


                        </label>
                      </div>
                    )}
                  </li>
                );
              })}

            </ul>

            {selectedSlots.length > 0 && (
              <div className="preview-container">
                <h3>📝 Preview of Selected Slots:</h3>
                {selectedSlots.map((slot, idx) => (
                  <div className="preview-slot" key={idx}>
                    <strong>{formatSlot(slot)}</strong><br />
                    Preferred Start: {slot.preferredStart || 'Not set'}<br />
                    Preferred End: {slot.preferredEnd || 'Not set'}
                  </div>
                ))}
              </div>
            )}


            <div className="submit-button-container">
              <button className="submit-button" onClick={handleSubmit}>
                Submit Availability
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorSessionBooking;
