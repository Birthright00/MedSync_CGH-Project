import "../styles/studenthomepage.css";
import StudentNavbar from "./studentnavbar.js";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
    WiDaySunny,
    WiCloud,
    WiCloudy,
    WiRain,
    WiThunderstorm,
    WiFog,
    WiSnow,
    WiShowers,
    WiDayCloudy,
    WiNightClear,
    WiNightCloudy,
    WiDayRain,
    WiNightRain,
} from "react-icons/wi";


const StudentHomePage = () => {
    const [timetableData, setTimetableData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [weather, setWeather] = useState(null);

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

        const fetchWeather = async () => {
            try {
                const response = await axios.get(
                    "https://www.meteosource.com/api/v1/free/point?place_id=singapore-1880252&sections=current&timezone=auto&language=en&units=metric&key=3ls3cu64cf7hamc0sztzhrjbpfj90kun55efyufa"
                );
                setWeather(response.data.current);
            } catch (error) {
                console.error("Weather API error:", error);
            }
        };

        fetchTimetable();
        fetchWeather();

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
        (entry) =>
            entry.day.toLowerCase() ===
            currentTime.toLocaleDateString("en-SG", { weekday: "long" }).toLowerCase()
    );

    const getWeatherIcon = (summary) => {
        if (!summary) return <WiDaySunny className="weather-widget-icon" />;
        const desc = summary.toLowerCase();

        if (desc.includes("sun") || desc.includes("clear")) return <WiDaySunny className="weather-widget-icon" />;
        if (desc.includes("cloudy")) return <WiCloudy className="weather-widget-icon" />;
        if (desc.includes("cloud")) return <WiCloud className="weather-widget-icon" />;
        if (desc.includes("overcast")) return <WiDayCloudy className="weather-widget-icon" />;
        if (desc.includes("rain") && desc.includes("night")) return <WiNightRain className="weather-widget-icon" />;
        if (desc.includes("rain") && desc.includes("day")) return <WiDayRain className="weather-widget-icon" />;
        if (desc.includes("rain")) return <WiRain className="weather-widget-icon" />;
        if (desc.includes("shower")) return <WiShowers className="weather-widget-icon" />;
        if (desc.includes("snow")) return <WiSnow className="weather-widget-icon" />;
        if (desc.includes("storm") || desc.includes("thunder")) return <WiThunderstorm className="weather-widget-icon" />;
        if (desc.includes("fog") || desc.includes("mist") || desc.includes("haze")) return <WiFog className="weather-widget-icon" />;
        if (desc.includes("night") && desc.includes("clear")) return <WiNightClear className="weather-widget-icon" />;
        if (desc.includes("night")) return <WiNightCloudy className="weather-widget-icon" />;

        return <WiDaySunny className="weather-widget-icon" />;
    };

    return (
        <>
            <StudentNavbar />
            <div className="student-home-page">
                <div className="home-grid">
                    <div className="left-panel">
                        <div style={{ display: "flex", gap: "20px" }}>
                            <div className="date-time-box">
                                <h3>{today}</h3>
                                <p className="current-time">{time}</p>
                            </div>

                            {weather && (
                                <motion.div
                                    className="weather-widget"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                    style={{ width: "180px" }}
                                >
                                    {getWeatherIcon(weather.summary)}
                                    <div>
                                        <div>{weather.summary}</div>
                                        <div>{weather.temperature}°C</div>
                                    </div>
                                </motion.div>
                            )}
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
                                        <strong>{event.subject}</strong> — {event.start_time} to {event.end_time} @{" "}
                                        {event.location}
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
