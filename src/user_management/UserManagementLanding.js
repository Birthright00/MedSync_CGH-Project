import Navbar from "../components/Navbar";
import "../styles/homepage.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";

import doctor from "../images/doctor.png";
import white_doctor from "../images/doctor_white.png";
import student from "../images/student.png";  // Add this image
import white_student from "../images/student_white.png"; // Add this too

import "react-toastify/dist/ReactToastify.css";

const UserManagementLanding = () => {
  const nav = useNavigate();
  const [isDoctorHovered, setIsDoctorHovered] = useState(false);
  const [isStudentHovered, setIsStudentHovered] = useState(false);
  const [announcements, setAnnouncements] = useState([]);

  const handleDoctor = () => nav("/management-home");
  const handleStudent = () => nav("/student-management");

  useEffect(() => {
    const announcementsData = [
      { id: 1, message: "Select a user type." },
    ];
    setAnnouncements(announcementsData);
  }, []);

  // ########################################## //
  // useEffect for announcements
  // Trigger toast notifications only after announcements are set
  // Run this effect whenever announcements change
  // ########################################## //
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
            <h1>User Management</h1>
            <p>Select a user type to manage their data.</p>
          </motion.div>
        </div>

        <div className="card-container">
          <motion.div
            className="data-card doctor-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onClick={handleDoctor}
            onMouseEnter={() => setIsDoctorHovered(true)}
            onMouseLeave={() => setIsDoctorHovered(false)}
          >
            <img
              src={isDoctorHovered ? white_doctor : doctor}
              alt="Doctor"
              className="card-icon"
            />
            <h2>Doctor Data</h2>
            <p>Manage doctor information, contracts, and assignments.</p>
          </motion.div>

          <motion.div
            className="data-card student-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={handleStudent}
            onMouseEnter={() => setIsStudentHovered(true)}
            onMouseLeave={() => setIsStudentHovered(false)}
          >
            <img
              src={isStudentHovered ? white_student : student}
              alt="Student"
              className="card-icon"
            />
            <h2>Student Data</h2>
            <p>Manage student profiles, timetables, and assignments.</p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default UserManagementLanding;
