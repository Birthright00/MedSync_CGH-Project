import Navbar from "../components/Navbar";
import "../styles/homepage.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import calendar from "../images/calender.png";  // Create icons like you did for doctor/nurse
import white_calendar from "../images/calender_white.png";
import email from "../images/email.png";
import white_email from "../images/email_white.png";

const SchedulerLanding = () => {
    const nav = useNavigate();
    const [isCreateHovered, setIsCreateHovered] = useState(false);
    const [isScheduleHovered, setIsScheduleHovered] = useState(false);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const announcementsData = [
            { id: 1, message: "Welcome to Scheduler!" },
        ];
        setAnnouncements(announcementsData);
    }, []);

    useEffect(() => {
        announcements.forEach((announcement) => {
            toast.info(announcement.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        });
    }, [announcements]);



    const handleCreate = () => {
        nav("/timetable/create");
    };

    const handleSchedule = () => {
        nav("/timetable/scheduling");
    };

    return (
        <>
            <Navbar />
            <ToastContainer />
            <div className="home-page">
                <div className="welcome-container">
                    <motion.div
                        className="welcome-message"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <h1>Scheduler</h1>
                        <p>What would you like to do?</p>
                    </motion.div>
                </div>

                <div className="card-container">
                    <motion.div
                        className="data-card doctor-card"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        onClick={handleCreate}
                        onMouseEnter={() => setIsCreateHovered(true)}
                        onMouseLeave={() => setIsCreateHovered(false)}
                    >
                        <img
                            src={isCreateHovered ? white_email : email}
                            alt="email"
                            className="card-icon"
                        />
                        <h2>Create New Session</h2>
                        <p>Start new timetable session for a doctor.</p>
                    </motion.div>

                    <motion.div
                        className="data-card nurse-card"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        onClick={handleSchedule}
                        onMouseEnter={() => setIsScheduleHovered(true)}
                        onMouseLeave={() => setIsScheduleHovered(false)}
                    >
                        <img
                            src={isScheduleHovered ? white_calendar : calendar}
                            alt="calender"
                            className="card-icon"
                        />
                        <h2>Timetable Scheduling</h2>
                        <p>Edit or modify the master timetable.</p>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default SchedulerLanding;
