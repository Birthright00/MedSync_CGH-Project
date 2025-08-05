// src/pages/CreateNewSession.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "../styles/createSession.css";
import API_BASE_URL from "../apiConfig";
import FRONTEND_BASE_URL from "../frontendConfig";
import { sendEmailViaGraph } from '../utils/sendGraphEmail';
import { v4 as uuidv4 } from 'uuid';



const CreateNewSession = () => {
    const [doctors, setDoctors] = useState([]);
    const [students, setStudents] = useState([]);
    const [sessionName, setSessionName] = useState('');
    const [customSessionName, setCustomSessionName] = useState('');
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [adminName, setAdminName] = useState('');
    const [sessionCount, setSessionCount] = useState('1'); // Default to 1x
    const [customSessionCount, setCustomSessionCount] = useState('');
    const [filterDept, setFilterDept] = useState("");
    const [filterDesignation, setFilterDesignation] = useState("");
    const [filterSchool, setFilterSchool] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [sessionSlots, setSessionSlots] = useState([
        { date: '', startTime: '', endTime: '' }
    ]);
    const [selectedTemplate, setSelectedTemplate] = useState('');




    useEffect(() => {
        const currentUserADID = localStorage.getItem("adid") || ""; // Fallback to empty string
        // Fetch doctors data from the API
        axios
            .get(`${API_BASE_URL}/main_data`)
            .then((res) => setDoctors(res.data))
            .catch((err) => console.error("Error fetching doctors:", err));

        //Fetch students
        axios
            .get(`${API_BASE_URL}/students?adid=${currentUserADID}`)
            .then((res) => setStudents(res.data))
            .catch((err) => console.error("Error fetching students:", err));
    }, []);

    const toggleDoctor = (mcr_number) => {
        setSelectedDoctors((prev) =>
            prev.includes(mcr_number)
                ? prev.filter((id) => id !== mcr_number)
                : [...prev, mcr_number]
        );
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Filter doctors based on selected filters
    // ✅ If no department or designation is selected, show all doctors
    const filteredDoctors = doctors.filter((doc) => {
        const matchesDept = !filterDept || doc.department === filterDept;
        const matchesDesignation = !filterDesignation || doc.designation === filterDesignation;
        return matchesDept && matchesDesignation;
    });

    // Filter students based on selected filters and session slots
    // ✅ If no date is selected, show all students
    const filteredStudents = students.filter((student) => {
        const matchesSchool = !filterSchool || student.school === filterSchool;
        const matchesYear = !filterYear || student.academicYear === filterYear;
        const matchesProgram = !filterProgram || student.program_name === filterProgram;

        const enrollmentStart = new Date(student.start_date);
        const enrollmentEnd = new Date(student.end_date);

        const hasAnyDateSelected = sessionSlots.some((slot) => slot.date);

        const isAvailableForAnySlot = hasAnyDateSelected
            ? sessionSlots.some((slot) => {
                if (!slot.date) return false;
                const sessionDate = new Date(slot.date);
                return enrollmentStart <= sessionDate && enrollmentEnd >= sessionDate;
            })
            : true; // ✅ No date selected → show all students

        return matchesSchool && matchesYear && matchesProgram && isAvailableForAnySlot;
    });

    // Handle changes, adding and removing of session slots in the table
    const handleSessionChange = (index, field, value) => {
        const updated = [...sessionSlots];
        updated[index][field] = value;
        setSessionSlots(updated);
    };

    const addSessionSlot = () => {
        setSessionSlots([...sessionSlots, { date: '', startTime: '', endTime: '' }]);
    };

    const removeSessionSlot = (index) => {
        if (sessionSlots.length === 1) return; // Prevent removing the only slot
        setSessionSlots(sessionSlots.filter((_, i) => i !== index));
    };

    const formatReadableSession = (dateStr, startTime, endTime) => {
        if (!dateStr || !startTime || !endTime) return "";

        const date = new Date(dateStr);
        const formattedDate = date.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const formatTime = (t) => {
            const [h, m] = t.split(":").map(Number);
            const suffix = h >= 12 ? "pm" : "am";
            const hour12 = h % 12 === 0 ? 12 : h % 12;
            return `${hour12}${m !== 0 ? `:${m.toString().padStart(2, "0")}` : ""}${suffix}`;
        };

        return `${formattedDate} (${formatTime(startTime)}–${formatTime(endTime)})`;
    };

    const generateStudentGroupSummary = () => {
        if (selectedStudents.length === 0) return "[No students selected]";

        // Filter selected student objects
        const selectedStudentObjs = students.filter((s) =>
            selectedStudents.includes(s.id)
        );

        // Group by school
        const schoolYearMap = {};
        selectedStudentObjs.forEach((s) => {
            const school = s.school || "Unknown School";
            const year = s.yearofstudy || "Unknown Year";

            if (!schoolYearMap[school]) {
                schoolYearMap[school] = new Set();
            }
            schoolYearMap[school].add(year);
        });

        // Format the summary
        const summary = Object.entries(schoolYearMap)
            .map(([school, years]) => {
                return `${school} (${Array.from(years).join(", ")})`;
            })
            .join(" + ");

        return summary;
    };



    const generateEmailContent = (sessionId) => {
        if (!selectedTemplate) return { subject: '', body: '' };

        if (selectedTemplate === 'tutorial_availability') {
            const selectedDoctorObjs = doctors.filter((doc) =>
                selectedDoctors.includes(doc.mcr_number)
            );

            const selectedStudentObjs = students.filter((s) =>
                selectedStudents.includes(s.id)
            );

            const toEmails = selectedDoctorObjs.map((doc) => doc.email).join(', ') || '[No recipient selected]';

            const doctorNames = selectedDoctorObjs
                .map((doc) => `Dr. ${doc.first_name} ${doc.last_name}`)
                .join(', ') || '[No doctor selected]';

            const studentNames = selectedStudentObjs
                .map((s) => `${s.name} (${s.school})`)
                .join(', ') || '[No students selected]';

            const sessionDetails = sessionSlots
                .filter((s) => s.date && s.startTime && s.endTime)
                .map((s, i) => `Session ${i + 1}: ${formatReadableSession(s.date, s.startTime, s.endTime)}`)
                .join('\n') || '[No session slots selected]';

            const replyLink = `${FRONTEND_BASE_URL}/#/doctor-availability/respond?session_id=${sessionId}`;

            const selectedSessionName = sessionName === 'Other' ? customSessionName : sessionName;

            const finalSessionCount = sessionCount === 'Other' ? customSessionCount : sessionCount;

            const subject = `Request for Availability – ${selectedSessionName ? selectedSessionName + " " : ""}Tutorial Session`;

            const studentGroupSummary = generateStudentGroupSummary();

            const body = `Dear ${doctorNames},

We are planning ${finalSessionCount}x ${selectedSessionName}
tutorial session involving the following students from ${studentGroupSummary}
${studentNames}.

Below are the proposed date availability/session slots:
${sessionDetails}

Please let us know your availability preferred date/start time for the above.
Teaching dates are subjected to first come, first served basis, your teaching hours will be logged.

If you prefer not to reply via email, you may indicate your availability directly here:
👉 ${replyLink}

Thank you,
${adminName || "[Admin Name]"}
Associate Dean’s Office (ADO)`;

            return { subject, body };
        }

        return { subject: '', body: '' };
    };


    const handleCreateSession = async () => {
        const sessionId = uuidv4(); // ✅ Generate UUID here
        const { subject, body } = generateEmailContent(sessionId);


        if (!subject || !body) {
            alert("❌ Please complete all required fields and select a valid email template.");
            return;
        }

        // ✅ Optional: Load token from API (assuming you have a working endpoint for this)
        let accessToken = "";
        try {
            const res = await axios.get(`${API_BASE_URL}/api/token`);
            accessToken = res.data.access_token;
        } catch (error) {
            alert("❌ Failed to retrieve access token.");
            console.error(error);
            return;
        }

        // ✅ Send the email
        await sendEmailViaGraph({
            selectedDoctors,
            doctors,
            subject,
            body,
            accessToken,
            sessionId,
        });

        try {
            await axios.post(`${API_BASE_URL}/api/email-sessions`, {
                session_id: sessionId,
                subject,
                body,
                to_emails: selectedDoctors
                    .map((mcr) => doctors.find((doc) => doc.mcr_number === mcr)?.email)
                    .filter(Boolean)
                    .join(','),
                doctor_mcrs: selectedDoctors.join(','),
                student_ids: selectedStudents.join(','),
                session_name: sessionName,
                created_at: new Date().toISOString(),
                available_slots_json: JSON.stringify(sessionSlots.map(slot => ({
                    date: slot.date,
                    startTime: slot.startTime,
                    endTime: slot.endTime
                })))
            });
            console.log("✅ Email session metadata saved");
        } catch (err) {
            console.error("❌ Failed to save email session metadata:", err);
        }

    };

    return (
        <>
            <Navbar />
            <div className="create-session-container">
                <div className="welcome-container">
                    <h1>Create New Timetable Session</h1>
                    <p>Set up a new timetable session and notify relevant doctors</p>
                </div>

                <div className="form-box">
                    {/* Session Name */}
                    <h2 className="section-title">📅 Session Slot(s)</h2>
                    <div className="form-group inline">
                        <label>Session Info</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {/* Session Count Dropdown */}
                            <select
                                value={sessionCount}
                                onChange={(e) => setSessionCount(e.target.value)}
                            >
                                <option value="1">1x</option>
                                <option value="2">2x</option>
                                <option value="3">3x</option>
                                <option value="Other">Other</option>
                            </select>
                            {sessionCount === 'Other' && (
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Custom count"
                                    value={customSessionCount}
                                    onChange={(e) => setCustomSessionCount(e.target.value)}
                                />
                            )}

                            {/* Session Topic Dropdown */}
                            <select
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                            >
                                <option value="">-- Select a Topic --</option>
                                <option value="Endo">Endo</option>
                                <option value="Derm">Derm</option>
                                <option value="Infection Diseases">Infection Diseases</option>
                                <option value="General Medicine">General Medicine</option>
                                <option value="Radiology">Radiology</option>
                                <option value="Surgery">Surgery</option>
                                <option value="Urology">Urology</option>
                                <option value="Ortho">Ortho</option>
                                <option value="Sports Medicine">Sports Medicine</option>
                                <option value="Geriatric">Geriatric</option>
                                <option value="Other">Other</option>
                            </select>
                            {sessionName === 'Other' && (
                                <input
                                    type="text"
                                    placeholder="Custom topic"
                                    value={customSessionName}
                                    onChange={(e) => setCustomSessionName(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch', marginTop: '1rem' }}>
                        {/* Session Table */}
                        <div style={{ flex: '2' }}>
                            <table className="session-table">
                                <thead>
                                    <tr>
                                        <th>Session</th>
                                        <th>Date</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sessionSlots.map((slot, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <input
                                                    type="date"
                                                    value={slot.date}
                                                    onChange={(e) => handleSessionChange(index, 'date', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) => handleSessionChange(index, 'startTime', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => handleSessionChange(index, 'endTime', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                {sessionSlots.length > 1 && (
                                                    <button type="button" onClick={() => removeSessionSlot(index)}>❌</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <button type="button" onClick={addSessionSlot} className="btn btn-outline">
                                ➕ Add Session Slot
                            </button>
                        </div>

                        {/* Admin Name Dropdown */}
                        <div style={{
                            flex: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            padding: '0.5rem',
                            border: '1px solid #d0e6ff',
                            borderRadius: '10px',
                            background: '#f9fcff',
                            height: 'fit-content'
                        }}>
                            <label style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#1976d2' }}>Admin Name</label>
                            <select
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.65rem',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '8px',
                                    background: '#fff'
                                }}
                            >
                                <option value="">-- Select Admin Name --</option>
                                <option value="Channe">Channe</option>
                                <option value="Jeffrey">Jeffrey</option>
                                <option value="Jennifer">Jennifer</option>
                                <option value="Rose">Rose</option>
                                <option value="Custom">Custom</option>
                            </select>
                            {adminName === "Custom" && (
                                <input
                                    type="text"
                                    placeholder="Enter custom name"
                                    value={customSessionName}
                                    onChange={(e) => setCustomSessionName(e.target.value)}
                                    style={{
                                        marginTop: '0.5rem',
                                        padding: '0.65rem',
                                        border: '2px solid #e0e0e0',
                                        borderRadius: '8px'
                                    }}
                                />
                            )}
                        </div>
                    </div>


                    {/* Filters */}
                    <div className="form-section">
                        <h2 className="section-title">
                            <span className="section-icon">👨‍⚕️</span>
                            Select Doctors to Notify
                            <span className="selected-count">{selectedDoctors.length} selected</span>
                        </h2>

                        <div className="doctor-filters">
                            <div className="form-group">
                                <label>Department</label>
                                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                                    <option value="">All Departments</option>
                                    {[...new Set(doctors.map((doc) => doc.department))].map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <select value={filterDesignation} onChange={(e) => setFilterDesignation(e.target.value)}>
                                    <option value="">All Designations</option>
                                    {[...new Set(doctors.map((doc) => doc.designation))].map((designation) => (
                                        <option key={designation} value={designation}>
                                            {designation}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Doctors Grid */}
                        <div className="doctors-grid">
                            {filteredDoctors.map((doc) => {
                                const initials = `${doc.first_name[0] || ""}${doc.last_name[0] || ""}`.toUpperCase();
                                const isSelected = selectedDoctors.includes(doc.mcr_number);
                                const designationClass = doc.designation?.toLowerCase().replace(/\s+/g, "-");

                                return (
                                    <div
                                        key={doc.mcr_number}
                                        className={`doctor-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => toggleDoctor(doc.mcr_number)}
                                    >
                                        <div className="doctor-info">
                                            <div className="doctor-avatar">{initials}</div>
                                            <div className="doctor-details">
                                                <h3>
                                                    Dr. {doc.first_name} {doc.last_name}
                                                    {doc.designation && (
                                                        <span className={`designation-badge designation-${designationClass}`}>
                                                            {doc.designation}
                                                        </span>
                                                    )}
                                                </h3>
                                                <p>{doc.department}</p>
                                                <p>{doc.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">
                            <span className="section-icon">👩‍🎓</span>
                            Select Students to Include
                            <span className="selected-count">{selectedStudents.length} selected</span>
                        </h2>

                        <div className="doctor-filters">
                            <div className="form-group">
                                <label>School</label>
                                <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
                                    <option value="">All Schools</option>
                                    {[...new Set(students.map((s) => s.school))].map((school) => (
                                        <option key={school} value={school}>{school}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Academic Year</label>
                                <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                                    <option value="">All Years</option>
                                    {[...new Set(students.map((s) => s.academicYear))].map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Program Name</label>
                                <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                                    <option value="">All Programs</option>
                                    {[...new Set(students.map((s) => s.program_name))].map((program) => (
                                        <option key={program} value={program}>{program}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="students-grid">
                            {filteredStudents.map((student) => {
                                const initials = `${student.name?.[0] || ""}${student.name?.split(" ")[1]?.[0] || ""}`.toUpperCase();
                                const isSelected = selectedStudents.includes(student.id);
                                return (
                                    <div
                                        key={student.id}
                                        className={`student-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => toggleStudent(student.id)}
                                    >
                                        <div className="student-info">
                                            <div className="student-avatar">{initials}</div>
                                            <div className="student-details">
                                                <h3>{student.name}</h3>
                                                <p>{student.school} || {student.academicYear}</p>
                                                <p>{student.yearofstudy}</p>
                                                <p>{student.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    <div className="form-section">
                        <h2 className="section-title">✉️ Email Template</h2>

                        <div className="form-group">
                            <label>Select Template</label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                                <option value="">-- Select an Email Template --</option>
                                <option value="tutorial_availability">
                                    📧 Tutorial Session – Ask Availability
                                </option>
                                {/* More templates can be added after your meeting */}
                            </select>
                        </div>

                        {selectedTemplate && (
                            <div className="email-preview-box">
                                <h3>Email Preview</h3>
                                <pre>{generateEmailContent().body}</pre>

                                {/* Optional: a button to trigger email sending later */}
                                {/* <button className="btn btn-primary">📤 Send Email</button> */}
                            </div>
                        )}
                    </div>


                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => {
                                setSelectedDoctors([]);
                                setSelectedStudents([]);
                                setFilterDept("");
                                setFilterDesignation("");
                                setFilterSchool("");
                                setFilterYear("");
                                setSessionSlots([{ date: '', startTime: '', endTime: '' }]);
                                setSelectedTemplate('');
                            }}
                        >
                            Cancel
                        </button>
                        <button className="btn btn-primary" type="button" onClick={handleCreateSession}>
                            Create Session
                        </button>

                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateNewSession;
