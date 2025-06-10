import "../styles/studenthomepage.css";
import StudentNavbar from "./studentnavbar.js";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const StudentHomePage = () => {
    const [timetableData, setTimetableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.log("No token found");
                    return;
                }

                const response = await axios.get("http://localhost:3001/student/timetable", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setTimetableData(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching timetable:", error);
                setLoading(false);
            }
        };

        fetchTimetable();

        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const today = currentTime.toLocaleDateString("en-SG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const time = currentTime.toLocaleTimeString("en-SG");

    const todayEvents = timetableData.filter(
        (entry) => entry.day.toLowerCase() === currentTime.toLocaleDateString("en-SG", { weekday: "long" }).toLowerCase()
    );

    return (
        <>
            <StudentNavbar />
            <div className="student-home-page">
                <div className="home-grid">
                    <div className="left-panel">
                        <div className="date-time-box">
                            <h3>{today}</h3>
                            <p className="current-time">{time}</p>
                        </div>
                        <div className="notification-panel">
                            <h4>📢 Notifications</h4>
                            <ul>
                                <li>📌 Class on 12 June moved to Room B202</li>
                                <li>📌 Pathology lecture on 14 June cancelled</li>
                                <li>📌 Clinicals on 15 June start at 8AM</li>
                            </ul>
                        </div>
                    </div>

                    <div className="right-panel">
                        <h4>📅 Today's Events</h4>
                        {loading ? (
                            <p>Loading...</p>
                        ) : todayEvents.length === 0 ? (
                            <p>No events today.</p>
                        ) : (
                            <ul className="events-list">
                                {todayEvents.map((event, index) => (
                                    <li key={index}>
                                        <strong>{event.subject}</strong> — {event.start_time} to {event.end_time} @ {event.location}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default StudentHomePage;
