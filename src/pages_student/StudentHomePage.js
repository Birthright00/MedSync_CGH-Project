import "../styles/studenthomepage.css";
import StudentNavbar from "./studentnavbar.js";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import moment from "moment";
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
import API_BASE_URL from '../apiConfig';
import { getStartEndTime } from "./parseTime.js";


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
                    const [start, end] = getStartEndTime(item.time);  // <-- ✅ Apply time parsing here
                    return {
                        session_id: item.id,
                        subject: `${item.session_name}`,
                        name: `${item.name}`,
                        day: day,
                        date: item.date,
                        start_time: start,
                        end_time: end,
                        location: item.location,
                        change_type: item.change_type,
                        change_reason: item.change_reason,
                        original_time: item.original_time,
                        is_read: item.is_read,
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

    const todayEvents = timetableData.filter((entry) =>
        moment(entry.date).isSame(currentTime, 'day')
    );


    const upcomingEvents = (() => {
        const now = new Date();

        const sorted = timetableData
            .filter(entry => {
                const eventDateTime = moment(`${entry.date} ${entry.start_time}`, [
                    "D MMMM YYYY h:mmA", "DD MMMM YYYY h:mmA"
                ]);
                return eventDateTime.isValid() && eventDateTime.toDate() > now;
            })
            .sort((a, b) => {
                const aDate = moment(`${a.date} ${a.start_time}`, ["D MMMM YYYY h:mmA", "DD MMMM YYYY h:mmA"]).toDate();
                const bDate = moment(`${b.date} ${b.start_time}`, ["D MMMM YYYY h:mmA", "DD MMMM YYYY h:mmA"]).toDate();
                return aDate - bDate;
            });

        const groupedByDate = {};
        for (const event of sorted) {
            if (!groupedByDate[event.date]) groupedByDate[event.date] = [];
            groupedByDate[event.date].push(event);
        }

        // Get sessions for next 3 days that have sessions
        return Object.values(groupedByDate).slice(0, 3).flat();
    })();

    const changeNotifications = timetableData
        .filter((item) => {
            const isChangeType = ["rescheduled", "resized", "location_changed"].includes(item.change_type);
            const isUnread = item.is_read === 0;
            if (!isChangeType || !isUnread) return false;

            const startMoment = moment(item.start_time, ["h:mmA", "hA", "hh:mmA"], true);
            if (!startMoment.isValid()) {
                console.warn("Invalid start_time format:", item.start_time);
                return false;
            }

            const dateMoment = moment(item.date, ["YYYY-MM-DD", "D/M/YYYY", "D MMMM YYYY", "DD MMMM YYYY"], true);
            if (!dateMoment.isValid()) {
                console.warn("Invalid date format:", item.date);
                return false;
            }

            const combinedDateTime = moment(`${item.date} ${item.start_time}`, ["YYYY-MM-DD h:mmA", "D/M/YYYY h:mmA", "D MMMM YYYY h:mmA", "DD MMMM YYYY h:mmA", "D MMMM YYYY hh:mmA", "DD MMMM YYYY hh:mmA"], true);
            if (!combinedDateTime.isValid()) {
                console.warn("Invalid combined datetime:", item.date, item.start_time);
                return false;
            }

            return combinedDateTime.toDate() >= new Date();
        })
        .map((item, idx) => {
            console.log("item.start_time:", item.start_time);
            const newDate = new Date(item.date);

            let formattedOriginalDate = "Not available";
            let formattedOriginalTime = "Not available";

            if (item.original_time) {
                const isoFormat = moment(item.original_time, moment.ISO_8601, true);
                if (isoFormat.isValid()) {
                    // Handle ISO format e.g., 2025-07-04T16:30
                    formattedOriginalDate = isoFormat.format("DD/MM/YYYY");
                    formattedOriginalTime = isoFormat.format("h:mmA");
                } else {
                    // Handle human-readable format e.g., "27 June 2025 8:30AM - 12:00PM"
                    const [originalDateStr, originalTimeRange] = item.original_time.split(/(?<=\d{4})\s+/);
                    const originalStart = originalTimeRange?.split("-")[0]?.trim();

                    const originalMoment = moment(`${originalDateStr} ${originalStart}`, ["D MMMM YYYY h:mmA", "DD MMMM YYYY h:mmA"]);
                    if (originalMoment.isValid()) {
                        formattedOriginalDate = originalMoment.format("DD/MM/YYYY");
                        formattedOriginalTime = originalMoment.format("h:mmA");
                    }
                }
            }



            const formattedNewDate = newDate.toLocaleDateString("en-SG");
            // Split time range
            const [start] = item.start_time?.split("-") || ["", ""];
            const formattedNewStartTime = start.trim();
            // const formattedNewEndTime = end ? end.trim() : "";

            const borderColor =
                item.change_type === "resized"
                    ? "#FFB703"
                    : item.change_type === "rescheduled"
                        ? "#FF6B6B"
                        : "#00BFA6"; // green for location_changed


            return {
                id: idx,
                element: (
                    <li key={idx} className="notification-card" style={{ borderLeft: `6px solid ${borderColor}` }}>
                        <div className="notification-header">
                            {item.change_type === "location_changed" ? (
                                <>
                                    📍 <strong>{item.subject}</strong> moved to new location.
                                </>
                            ) : (
                                <>
                                    🕒 <strong>{item.subject}</strong>{" "}
                                    {item.change_type === "resized"
                                        ? "resized."
                                        : "rescheduled."}
                                </>
                            )}
                        </div>

                        <div className="notification-details">
                            {item.change_type === "location_changed" ? (
                                <div>
                                    <span className="label">New Location:</span>{" "}
                                    <span className="value">@ {item.location}</span>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <span className="label">Originally:</span>{" "}
                                        <span className="value">{formattedOriginalDate} at {formattedOriginalTime}</span>
                                    </div>
                                    <div>
                                        <span className="label">Now:</span>{" "}
                                        <span className="value">{formattedNewDate} at {formattedNewStartTime}</span>
                                    </div>
                                    <div>
                                        <span className="label">Doctor:</span>{" "}
                                        <span className="value">{item.name}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        <button
                            className="mark-as-read-button"
                            onClick={() => handleMarkAsRead(item)}
                        >
                            Mark as Read
                        </button>
                    </li>
                )
            };
        });

    const handleMarkAsRead = async (item) => {
        try {
            const token = localStorage.getItem("token");
            await axios.patch(`${API_BASE_URL}/api/scheduling/mark-as-read/${item.session_id}`, {
                is_read: true,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Locally update
            setTimetableData(prev =>
                prev.map(i => i.session_id === item.session_id ? { ...i, is_read: 1 } : i)
            );
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };



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
                        <ul className="notification-list">
                            {changeNotifications.length === 0 ? (
                                <li className="notification-card">
                                    <div className="notification-header">No new notifications</div>
                                </li>
                            ) : (
                                changeNotifications.map(note => note.element)
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
                                        <li key={index} className="event-card">
                                            <div className="event-left">
                                                <strong>{event.subject}</strong>
                                                <p>{event.date}, {event.day}</p>
                                            </div>
                                            <div className="event-right">
                                                <span className="event-time">
                                                    {event.start_time} - {event.end_time}
                                                </span>
                                                <span className="event-location">@ {event.location}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <ul className="events-list">
                                {todayEvents.map((event, index) => (
                                    <li key={index} className="event-card">
                                        <div className="event-left">
                                            <strong>{event.subject}</strong>
                                            <p>{event.date}, {event.day}</p>
                                        </div>
                                        <div className="event-right">
                                            <span className="event-time">
                                                {event.start_time} - {event.end_time}-
                                            </span>
                                            <span className="event-location">@ {event.location}</span>
                                        </div>
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
