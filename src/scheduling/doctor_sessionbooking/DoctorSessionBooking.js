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
  const [customSlots, setCustomSlots] = useState([{ date: '', startTime: '', endTime: '' }]);

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

  const addCustomSlot = () => {
    setCustomSlots([...customSlots, { date: '', startTime: '', endTime: '' }]);
  };

  const removeCustomSlot = (index) => {
    if (customSlots.length > 1) {
      setCustomSlots(customSlots.filter((_, i) => i !== index));
    }
  };

  const updateCustomSlot = (index, field, value) => {
    const updated = [...customSlots];
    updated[index][field] = value;
    setCustomSlots(updated);
  };

  const handleSubmit = async () => {
    // Get valid custom slots
    const validCustomSlots = customSlots.filter(slot => 
      slot.date && slot.startTime && slot.endTime
    );
    
    if (!doctorMCR || (selectedSlots.length === 0 && validCustomSlots.length === 0)) {
      setError("Please enter your MCR/SNB number and select at least one slot or provide custom availability.");
      return;
    }

    // Validate selected slots
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
    
    // Validate custom slots
    for (const slot of validCustomSlots) {
      if (slot.endTime <= slot.startTime) {
        setError(`Custom slot: End time must be later than start time for ${slot.date}`);
        return;
      }
    }

    try {
      // Format the selected slots
      const cleanedSelectedSlots = selectedSlots.map(slot => ({
        date: slot.date,
        start: slot.preferredStart || slot.startTime || slot.start,
        end: slot.preferredEnd || slot.endTime || slot.end,
      }));
      
      // Format the custom slots  
      const cleanedCustomSlots = validCustomSlots.map(slot => ({
        date: slot.date,
        start: slot.startTime,
        end: slot.endTime,
      }));
      
      // Combine both types of slots
      const allSlots = [...cleanedSelectedSlots, ...cleanedCustomSlots];

      await axios.patch(`${API_BASE_URL}/api/scheduling/parsed-email/${sessionId}/update-availability`, {
        selected_slots: allSlots,
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

            {/* Custom Time Slots Section */}
            <div className="custom-slots-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>🆕 Suggest Alternative Time Slots</h3>
              <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '1rem' }}>
                If none of the above slots work for you, please suggest your own available time slots:
              </p>
              
              {customSlots.map((slot, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  marginBottom: '10px', 
                  alignItems: 'center',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  backgroundColor: '#fff'
                }}>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontSize: '0.8em', color: '#666', display: 'block' }}>Date:</label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateCustomSlot(index, 'date', e.target.value)}
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontSize: '0.8em', color: '#666', display: 'block' }}>Start Time:</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateCustomSlot(index, 'startTime', e.target.value)}
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>
                  <div style={{ flex: '1' }}>
                    <label style={{ fontSize: '0.8em', color: '#666', display: 'block' }}>End Time:</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      min={slot.startTime}
                      onChange={(e) => updateCustomSlot(index, 'endTime', e.target.value)}
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>
                  {customSlots.length > 1 && (
                    <button 
                      onClick={() => removeCustomSlot(index)}
                      style={{ 
                        background: '#ff4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '3px',
                        padding: '5px 8px',
                        cursor: 'pointer',
                        alignSelf: 'flex-end'
                      }}
                      title="Remove this slot"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                onClick={addCustomSlot}
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                + Add Another Custom Slot
              </button>
              
              {/* Preview of Custom Slots */}
              {customSlots.some(slot => slot.date && slot.startTime && slot.endTime) && (
                <div className="custom-preview-container" style={{ marginTop: '1rem' }}>
                  <h4>📝 Custom Slots Preview:</h4>
                  {customSlots.filter(slot => slot.date && slot.startTime && slot.endTime).map((slot, idx) => (
                    <div className="custom-preview-slot" key={idx} style={{ 
                      padding: '8px', 
                      margin: '5px 0', 
                      backgroundColor: '#e8f5e8', 
                      border: '1px solid #4CAF50',
                      borderRadius: '3px'
                    }}>
                      <strong>{new Date(slot.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong><br />
                      Time: {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
