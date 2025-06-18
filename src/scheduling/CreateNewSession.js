// src/pages/CreateNewSession.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "../styles/createSession.css";
import API_BASE_URL from "../apiConfig";

const CreateNewSession = () => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctors, setSelectedDoctors] = useState([]);
    const [filterDept, setFilterDept] = useState("");
    const [filterDesignation, setFilterDesignation] = useState("");

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/main_data`)
            .then((res) => setDoctors(res.data))
            .catch((err) => console.error("Error fetching doctors:", err));
    }, []);

    const toggleDoctor = (mcr_number) => {
        setSelectedDoctors((prev) =>
            prev.includes(mcr_number)
                ? prev.filter((id) => id !== mcr_number)
                : [...prev, mcr_number]
        );
    };

    const filteredDoctors = doctors.filter((doc) => {
        const matchesDept = !filterDept || doc.department === filterDept;
        const matchesDesignation = !filterDesignation || doc.designation === filterDesignation;
        return matchesDept && matchesDesignation;
    });

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
                    <div className="form-group">
                        <label htmlFor="sessionName">Session Name</label>
                        <input type="text" id="sessionName" name="sessionName" required />
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

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => {
                                setSelectedDoctors([]);
                                setFilterDept("");
                                setFilterDesignation("");
                            }}
                        >
                            Cancel
                        </button>
                        <button className="btn btn-primary" type="submit">
                            Create Session
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateNewSession;
