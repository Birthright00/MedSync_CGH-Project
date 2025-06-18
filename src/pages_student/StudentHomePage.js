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
import { MdNotifications, MdEventNote, MdSchedule } from "react-icons/md";
import API_BASE_URL from '../apiConfig';


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

                const response = await axios.get(`${API_BASE_URL}/api/scheduling/timetable`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const mappedData = response.data.map(item => {
                    const dateObj = new Date(item.date);
                    const day = dateObj.toLocaleDateString("en-SG", { weekday: "long" });
                    return {
                        subject: `${item.session_name} (${item.name})`,
                        day: day,
                        date: item.date,
                        start_time: item.time,
                        end_time: "",
                        location: item.location,
                        change_type: item.change_type,
                        change_reason: item.change_reason,
                        original_time: item.original_time,
                    };
                });

                setTimetableData(mappedData);
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

        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        const timetableInterval = setInterval(fetchTimetable, 5000); // <-- 🔁 ADD THIS

        return () => {
            clearInterval(timeInterval);
            clearInterval(timetableInterval); // <-- CLEANUP
        };
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

    const upcomingEvents = timetableData.filter((entry) => {
        const todayDate = new Date();
        const weekdays = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
            thursday: 4, friday: 5, saturday: 6
        };
        const eventDay = weekdays[entry.day.toLowerCase()];
        return eventDay >= todayDate.getDay();
    }).slice(0, 3); // limit to 3 upcoming events

    const changeNotifications = timetableData
        .filter(item => ["rescheduled", "resized"].includes(item.change_type))
        .map((item, idx) => {
            const originalDate = new Date(item.original_time);
            const newDate = new Date(item.date);

            const formattedOriginalDate = originalDate.toLocaleDateString("en-SG");
            const formattedOriginalTime = originalDate.toLocaleTimeString("en-SG", { hour: '2-digit', minute: '2-digit', hour12: true });

            const formattedNewDate = newDate.toLocaleDateString("en-SG");
            // Split time range
            const [start, end] = item.start_time?.split("-") || ["", ""];
            const formattedNewStartTime = start.trim();
            const formattedNewEndTime = end ? end.trim() : "";


            return (
                <li key={idx} className="notification-card">
                    <div className="notification-header">
                        🕒 <strong>{item.subject}</strong>{" "}
                        {item.change_type === "resized"
                            ? "was resized."
                            : item.change_type === "rescheduled"
                                ? "was rescheduled."
                                : ""}
                    </div>
                    <div className="notification-details">
                        <div>
                            <span className="label">Originally:</span>{" "}
                            <span className="value">{formattedOriginalDate} at {formattedOriginalTime}</span>
                        </div>
                        <div>
                            <span className="label">Now:</span>{" "}
                            <span className="value">{formattedNewDate} at {formattedNewStartTime} - {formattedNewEndTime}</span>
                        </div>
                    </div>
                </li>
            );
        });



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

                <div className="top-bar">
                    <div className="date-weather-wrapper">
                        <div className="date-time-box">
                            <h3>{today}</h3>
                            <p className="current-time">
                                <span className="time-wrapper">{time}</span>
                            </p>
                        </div>

                        {weather && (
                            <motion.div
                                className="weather-widget"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                {getWeatherIcon(weather.summary)}
                                <div>
                                    <div>{weather.summary}</div>
                                    <div>{weather.temperature}°C</div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="home-grid">

                    <div className="notification-panel">
                        <h4>📢 Notifications</h4>
                        <ul>
                            {changeNotifications.length === 0 ? (
                                <li>No new notifications</li>
                            ) : (
                                changeNotifications.map((note, idx) => <li key={idx}>{note}</li>)
                            )}
                        </ul>
                    </div>

                    <div className="right-panel">
                        <h4>📅 Today's Events</h4>
                        {loading ? (
                            <p>Loading...</p>
                        ) : todayEvents.length === 0 ? (
                            <>
                                <p>No events today.</p>
                                <h4>🔜 Upcoming Sessions:</h4>
                                <ul className="events-list">
                                    {upcomingEvents.map((event, index) => (
                                        <li key={index}>
                                            <strong>{event.subject}</strong> — {event.day} {event.start_time} to {event.end_time} @ {event.location}
                                        </li>
                                    ))}
                                </ul>
                            </>
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
