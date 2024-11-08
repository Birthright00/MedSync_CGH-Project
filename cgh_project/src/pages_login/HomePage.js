import Navbar from "../components/Navbar";
import "../styles/homepage.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import nurse from "../images/nurse.png";
import white_nurse from "../images/nurse_white.png";
import doctor from "../images/doctor.png";
import white_doctor from "../images/doctor_white.png";

import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/footer";

// ########################################## //
// Hardcoded Quotes
// ########################################## //
const quotes = [
  "'The best way to find yourself is to lose yourself in the service of others.'",
  "'Every nurse was drawn to nursing because of a desire to care, to serve, or to help.'",
  "'Success is not the key to happiness. Happiness is the key to success.'",
  "'Health is not valued till sickness comes.'",
  "'To know even one life has breathed easier because you have lived. This is to have succeeded.'",
  "'The greatest gift you can give someone is your time, your attention, your love, your concern.'",
  "'Nurses are a unique kind. They have this insatiable need to care for others, which is both their greatest strength and fatal flaw.'",
  "'Saving lives is not a job, it’s a calling. For those who choose to answer, the world is forever grateful.'",
  "'A hero is someone who has given his or her life to something bigger than oneself.'",
  "'It is not how much you do, but how much love you put in the doing.'",
  "'To care for those who once cared for us is one of the highest honors.'",
  "'You don’t build a house without its foundation. You don’t build a hospital without its nurses.'",
  "'Medicine is a science of uncertainty and an art of probability.'",
  "'In nothing do men more nearly approach the gods than in giving health to men.'",
  "'Caring for others is an expression of what it means to be fully human.'",
];

const HomePage = () => {
  const nav = useNavigate();
  const handleDoctor = () => {
    nav("/management-home");
  };

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [direction, setDirection] = useState(1); // Track animation direction
  const [announcements, setAnnouncements] = useState([]);
  const [isNurseHovered, setIsNurseHovered] = useState(false);
  const [isDoctorHovered, setIsDoctorHovered] = useState(false);

  useEffect(() => {
    const announcementsData = [
      { id: 1, message: "System maintenance scheduled for Dec 16." },
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

  // ########################################## //
  // useEffect for rotating carousel
  // ########################################## //
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1); // Always move forward
      setQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 3000); // Rotate every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

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
            <h1>Welcome Back</h1>
            <p>What would you like to do today?</p>
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
              alt="doctor"
              className="card-icon"
            />
            <h2>Doctor Data</h2>
            <p>Manage doctor information, contracts, and promotions.</p>
          </motion.div>

          <motion.div
            className="data-card nurse-card"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onMouseEnter={() => setIsNurseHovered(true)}
            onMouseLeave={() => setIsNurseHovered(false)}
          >
            <img
              src={isNurseHovered ? white_nurse : nurse}
              alt="nurse"
              className="card-icon"
            />
            <h2>Nurse Data</h2>
            <p>Access nurse records and shift schedules.</p>
          </motion.div>
        </div>{" "}
        <div className="quote-carousel">
          <AnimatePresence initial={false} custom={direction}>
            <motion.p
              key={quoteIndex}
              initial={{ x: direction * 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -direction * 100, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {quotes[quoteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
