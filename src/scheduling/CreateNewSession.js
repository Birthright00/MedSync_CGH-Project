// src/pages/CreateNewSession.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "../styles/createSession.css";
import API_BASE_URL from "../apiConfig";
import { sendEmailViaGraph } from '../utils/sendGraphEmail';
import { v4 as uuidv4 } from 'uuid';



const CreateNewSession = () => {
    const [doctors, setDoctors] = useState([]);
    const [students, setStudents] = useState([]);
    const [sessionName, setSessionName] = useState('');
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [filterDept, setFilterDept] = useState("");
    const [filterDesignation, setFilterDesignation] = useState("");
    const [filterSchool, setFilterSchool] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [sessionSlots, setSessionSlots] = useState([
        { date: '', startTime: '', endTime: '' }
    ]);
    const [selectedTemplate, setSelectedTemplate] = useState('');




    useEffect(() => {
        // Fetch doctors data from the API
        axios
            .get(`${API_BASE_URL}/main_data`)
            .then((res) => setDoctors(res.data))
            .catch((err) => console.error("Error fetching doctors:", err));

        //Fetch students
        axios
            .get(`${API_BASE_URL}/students`)
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

        return matchesSchool && matchesYear && isAvailableForAnySlot;
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


    const generateEmailContent = () => {
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


            const subject = `Request for Availability – ${sessionName ? sessionName + " " : ""}Tutorial Session`;

            const body = `Dear ${doctorNames},

We are planning a tutorial session involving the following students:
${studentNames}.

Here are the proposed session slots:
${sessionDetails}

Please let us know your availability for the above.

Thank you,
Education Office`;

            return { subject, body };
        }

        return { subject: '', body: '' };
    };


    const handleCreateSession = async () => {
        const sessionId = uuidv4(); // ✅ Generate UUID here
        const { subject, body } = generateEmailContent();

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
                created_at: new Date().toISOString()
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
                    <div className="form-group">
                        <label htmlFor="sessionName">Session Name</label>
                        <input
                            type="text"
                            id="sessionName"
                            name="sessionName"
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            required
                        />
                    </div>

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
                                                <p>{student.school}</p>
                                                <p>{student.academicYear}</p>
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
